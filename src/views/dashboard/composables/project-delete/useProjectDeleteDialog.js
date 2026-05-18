import { h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'
import { fillDeleteText, getProjectDeleteScopeOptions } from '../dialogUtils'

const PROJECT_DELETE_SCOPE_WRAP_STYLE = 'width:100%;padding-top:4px;'
const PROJECT_DELETE_SCOPE_CARD_STYLE = 'display:flex;align-items:flex-start;gap:10px;width:100%;padding:10px 12px;margin:8px 0;border:1px solid #e4e7ed;border-radius:8px;cursor:pointer;'
const PROJECT_DELETE_SCOPE_CARD_ACTIVE_STYLE = 'display:flex;align-items:flex-start;gap:10px;width:100%;padding:10px 12px;margin:8px 0;border:1px solid #409eff;border-radius:8px;cursor:pointer;background:#ecf5ff;'

/**
 * Project delete workflow.
 * This module owns delete confirmation, delete-scope selection, backend delete request,
 * store refresh, and terminal output after deletion.
 */
export const useProjectDeleteDialog = (options) => {
  const {
    projectStore,
    selectedProject,
    projectDrawerVisible,
    activeSessionAlias,
    appendTerminal,
    projectDeleteSuccessTextTemplate,
  } = options

  const deleteProject = async (project) => {
    try {
      await ElMessageBox.confirm(
        '该操作会不可逆，谨慎操作。',
        '删除风险提示',
        {
          type: 'warning',
          confirmButtonText: '确认',
          cancelButtonText: '取消',
        },
      )
    } catch {
      return
    }

    let deleteScope = 'project_only'
    try {
      const deleteScopeOptions = getProjectDeleteScopeOptions(project)
      let selectedScope = deleteScopeOptions[0].value

      await ElMessageBox({
        title: '删除范围选择',
        customClass: 'project-delete-scope-box',
        width: '560px',
        message: () =>
          h('div', { style: PROJECT_DELETE_SCOPE_WRAP_STYLE }, [
            h('div', { style: 'margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #303133;' }, '请选择删除范围'),
            h('div', { style: 'margin-bottom: 10px; font-size: 12px; color: #909399;' }, '不同选项会影响项目目录、Conda环境和数据库。'),
            ...deleteScopeOptions.map((opt) =>
              h('label', {
                style: selectedScope === opt.value ? PROJECT_DELETE_SCOPE_CARD_ACTIVE_STYLE : PROJECT_DELETE_SCOPE_CARD_STYLE,
              }, [
                h('input', {
                  type: 'radio',
                  name: 'project-delete-scope',
                  style: 'margin-top: 2px; accent-color: #409eff;',
                  checked: selectedScope === opt.value,
                  onChange: () => {
                    selectedScope = opt.value
                  },
                }),
                h('div', null, [
                  h('div', { style: 'font-size: 13px; color: #303133; line-height: 1.4;' }, opt.label),
                ]),
              ]),
            ),
          ]),
        showCancelButton: true,
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        closeOnClickModal: false,
      })

      deleteScope = selectedScope
    } catch {
      return
    }

    try {
      await projectApi.deleteProject([project.id], deleteScope)
      projectStore.removeProject(project.id)
      if (selectedProject.value && selectedProject.value.id === project.id) {
        projectDrawerVisible.value = false
      }
      const deleteScopeOptions = getProjectDeleteScopeOptions(project)
      const hit = deleteScopeOptions.find((x) => x.value === deleteScope) || deleteScopeOptions[0]
      ElMessage.success(fillDeleteText(projectDeleteSuccessTextTemplate.value, project.name))
      await projectStore.loadBundle()
      appendTerminal('[会话:' + activeSessionAlias.value + '] 删除项目 ' + project.name + '（范围：' + hit.label + '）')
    } catch (error) {
      ElMessage.error(getErrorMessage(error, '删除项目失败'))
    }
  }


  return {
    deleteProject,
  }
}
