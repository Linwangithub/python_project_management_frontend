<template>
  <el-dialog
    :model-value="modelValue"
    title="项目设置"
    :width="width || '860px'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="setting-workflow">
      <div ref="stepperRef" class="workflow-stepper" role="list" aria-label="设置流程">
        <svg class="stepper-svg" :viewBox="`0 0 ${stepperSize.width} ${stepperSize.height}`" preserveAspectRatio="none">
          <g v-for="line in connectorLines" :key="line.key">
            <path
              class="stepper-path"
              :class="{ done: line.done }"
              :d="line.d"
            />
            <polygon
              class="stepper-arrow-shape"
              :class="{ done: line.done }"
              :points="line.arrowPoints"
            />
          </g>
        </svg>
        <div
          v-for="item in stepRenderItems"
          :key="item.step.key"
          class="step-item"
          :class="[stepStatusClass(item.index), stepRowClass(item.index), stepTurnClass(item.index)]"
          :style="item.gridStyle"
        >
          <div
            class="step-node"
            :ref="(el) => setStepNodeRef(el, item.index)"
          >
            <div class="step-dot">{{ item.index + 1 }}</div>
            <div class="step-label">{{ item.step.title }}</div>
          </div>
        </div>
      </div>

      <div class="workflow-card">
        <h4 class="card-title">{{ currentStepMeta.title }}</h4>

        <div v-if="currentStep === 0" class="step-content">
          <el-form label-position="top">
            <el-form-item label="是否修改项目描述">
              <el-switch
                v-model="form.descriptionModifyEnabled"
                active-text="修改"
                inactive-text="不修改"
              />
            </el-form-item>
            <el-form-item label="项目描述">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                :disabled="!form.descriptionModifyEnabled"
                placeholder="请输入项目描述"
                @blur="checkDescriptionChange"
              />
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="currentStep === 1" class="step-content">
          <el-form label-position="top">
            <el-form-item label="是否修改Conda环境">
              <el-switch
                v-model="form.condaModifyEnabled"
                active-text="修改"
                inactive-text="不修改"
              />
            </el-form-item>
            <el-form-item label="Conda环境">
              <el-select
                v-model="form.condaEnvName"
                :disabled="!form.condaModifyEnabled"
                placeholder="请选择或输入Conda环境名称"
                filterable
                allow-create
                default-first-option
                :reserve-keyword="false"
                :loading="condaEnvLoading"
                style="width: 100%"
                @blur="checkCondaEnvName"
                @change="checkCondaEnvName"
              >
                <el-option
                  v-for="envName in condaEnvOptions"
                  :key="envName"
                  :label="envName"
                  :value="envName"
                />
              </el-select>
              <div v-if="condaEnvCheckMessage" class="field-hint" :class="{ success: condaEnvNameChecked }">
                {{ condaEnvCheckMessage }}
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="currentStep === 2" class="step-content">
          <el-form label-position="top">
            <el-form-item v-if="hasOriginalEntryFilePath()" label="是否修改项目入口文件">
              <el-switch
                v-model="form.entryFilePathModifyEnabled"
                active-text="修改"
                inactive-text="不修改"
              />
            </el-form-item>
            <el-form-item label="项目入口文件位置">
              <div class="entry-picker-block">
                <el-cascader
                  v-model="entryPathCascaderValue"
                  class="entry-cascader"
                  :options="entryPathOptions"
                  :props="entryPathProps"
                  clearable
                  filterable
                  :disabled="!isEntryFileEditable"
                  :show-all-levels="false"
                  placeholder="请选择项目入口文件"
                  @change="onEntryPathChange"
                  @clear="onEntryClear"
                />
                <div class="selected-line">
                  <span class="selected-label">已选择：</span>
                  <span class="selected-value">{{ selectedEntryText || ' ' }}</span>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="currentStep === 3" class="step-content">
          <el-form label-position="top">
            <el-form-item v-if="hasOriginalDevCommand()" label="是否修改开发启动命令">
              <el-switch
                v-model="form.devCommandModifyEnabled"
                active-text="修改"
                inactive-text="不修改"
              />
            </el-form-item>
            <el-form-item label="开发启动命令">
              <el-input
                v-model="form.devCommand"
                type="textarea"
                :rows="4"
                :disabled="!isDevCommandEditable"
                placeholder="例如：python main.py 或 python manage.py runserver 0.0.0.0:8000"
              />
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="currentStep === 4" class="step-content">
          <el-form label-position="top">
            <el-form-item v-if="hasOriginalDeployCommand()" label="是否修改部署启动命令">
              <el-switch
                v-model="form.deployCommandModifyEnabled"
                active-text="修改"
                inactive-text="不修改"
              />
            </el-form-item>
            <el-form-item label="部署启动命令">
              <el-input
                v-model="form.deployCommand"
                type="textarea"
                :rows="4"
                :disabled="!isDeployCommandEditable"
                placeholder="例如：gunicorn main:app --bind 0.0.0.0:{{port}}"
              />
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="currentStep === 5" class="step-content">
          <el-form label-position="top">
            <el-form-item :label="settingText.enableNginxConfig">
              <el-switch
                v-model="form.nginxEnabled"
                :active-text="settingText.enabled"
                :inactive-text="settingText.disabled"
              />
            </el-form-item>

            <template v-if="form.nginxEnabled">
              <el-form-item v-if="hasOriginalNginxConfig()" :label="settingText.modifyNginxConfig">
                <el-switch
                  v-model="form.nginxModifyEnabled"
                  :active-text="settingText.modify"
                  :inactive-text="settingText.onlyView"
                />
              </el-form-item>

              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item :label="settingText.nginxServerIp">
                    <el-select
                      v-model="form.nginxServerIp"
                      :disabled="!isNginxConfigEditable"
                      clearable
                      filterable
                      :placeholder="settingText.chooseNginxServerIp"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="ip in serverIpOptions"
                        :key="ip"
                        :label="ip"
                        :value="ip"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item :label="settingText.checkNginxService">
                    <el-button
                      :type="form.nginxChecked ? 'success' : 'primary'"
                      :loading="form.nginxChecking"
                      :disabled="!isNginxConfigEditable || !form.nginxServerIp"
                      @click="checkSettingNginxAvailability"
                    >
                      {{ form.nginxChecked ? settingText.passed : settingText.checkNginx }}
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item :label="settingText.nginxConfPath">
                <div
                  class="nginx-conf-chooser"
                  :class="{ 'is-disabled': !isNginxConfigEditable || !form.nginxChecked || form.nginxChecking }"
                >
                  <div v-if="form.nginxChecking" class="nginx-conf-loading">
                    <el-icon class="is-loading">
                      <Loading />
                    </el-icon>
                    <span>{{ settingText.loadingNginxConf }}</span>
                  </div>

                  <el-row class="nginx-conf-row" :gutter="12">
                    <el-col class="nginx-conf-col" :span="12">
                      <div
                        class="nginx-conf-card"
                        :class="{ active: hasExistingConfPath, 'is-card-disabled': hasNewConfDraft }"
                      >
                        <div class="nginx-conf-card__title">{{ settingText.useExistingConf }}</div>
                        <el-select
                          v-model="form.nginxExistingConfPath"
                          :disabled="!isNginxConfigEditable || !form.nginxChecked || form.nginxChecking || hasNewConfDraft"
                          clearable
                          filterable
                          :placeholder="settingText.chooseExistingConf"
                          style="width: 100%"
                          @change="handleExistingConfChange"
                          @clear="handleExistingConfChange('')"
                        >
                          <el-option
                            v-for="opt in nginxExistingConfOptions"
                            :key="opt.value"
                            :label="opt.label"
                            :value="opt.value"
                            :disabled="opt.disabled"
                          />
                        </el-select>
                        <div class="nginx-conf-preview" :class="{ danger: hasNewConfDraft }">
                          {{ hasNewConfDraft ? settingText.existingDisabledTip : settingText.chooseExistingTip }}
                        </div>
                      </div>
                    </el-col>

                    <el-col class="nginx-conf-col" :span="12">
                      <div
                        class="nginx-conf-card"
                        :class="{ active: hasNewConfDraft, 'is-card-disabled': hasExistingConfPath }"
                      >
                        <div class="nginx-conf-card__title">{{ settingText.createNewConf }}</div>
                        <el-cascader
                          v-model="form.nginxNewConfDirCascaderValue"
                          class="nginx-dir-cascader"
                          :disabled="!isNginxConfigEditable || !form.nginxChecked || form.nginxChecking || hasExistingConfPath"
                          :options="nginxNewConfDirTreeOptions"
                          :props="nginxDirCascaderProps"
                          clearable
                          filterable
                          :show-all-levels="false"
                          :placeholder="settingText.chooseNginxDir"
                          @change="handleNewConfDirCascaderChange"
                          @clear="handleNewConfDirClear"
                        />
                        <div class="selected-line">
                          <span class="selected-label">{{ settingText.selected }}</span>
                          <span class="selected-value">{{ selectedNginxDirText || ' ' }}</span>
                        </div>
                        <el-input
                          v-model="form.nginxNewConfFileName"
                          :disabled="!isNginxConfigEditable || !form.nginxChecked || form.nginxChecking || hasExistingConfPath || !form.nginxNewConfDirPath"
                          :placeholder="settingText.inputConfFileName"
                          @input="handleNewConfChange"
                        />
                        <div class="nginx-conf-preview" :class="{ danger: isNewConfFileInvalid }">
                          {{ newConfTip }}
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </el-form-item>

              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item :label="settingText.nginxFrontendPort">
                    <el-input
                      v-model="form.frontendPort"
                      :disabled="nginxPortFieldsDisabled"
                      :placeholder="settingText.port8080"
                      @blur="checkSettingNginxPort('frontend')"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item :label="settingText.backendDeployPort">
                    <el-input
                      v-model="form.backendDeployPort"
                      :disabled="nginxPortFieldsDisabled"
                      :placeholder="settingText.port8000"
                      @blur="checkSettingNginxPort('backend')"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item :label="settingText.previewDetailConfig">
                    <el-popover
                      v-model:visible="form.nginxPreviewVisible"
                      placement="right-start"
                      :width="560"
                      trigger="manual"
                      :teleported="false"
                      popper-class="nginx-preview-popover"
                    >
                      <template #reference>
                        <el-button
                          :type="form.nginxPreviewConfirmed ? 'success' : 'info'"
                          :disabled="!canShowNginxPreview"
                          @click="openNginxPreview"
                        >
                          {{ form.nginxPreviewConfirmed ? settingText.previewConfirmed : settingText.previewDetailConfig }}
                        </el-button>
                      </template>
                      <div class="nginx-preview-editor">
                        <div class="nginx-preview-editor__header">{{ settingText.nginxDetailConfig }}</div>
                        <el-input
                          v-model="form.nginxPreviewDraft"
                          type="textarea"
                          :disabled="!isNginxConfigEditable"
                          :rows="18"
                          resize="vertical"
                          :placeholder="settingText.confirmOrAdjustNginxConfig"
                        />
                        <div class="nginx-preview-editor__footer">
                          <el-button @click="cancelNginxPreview">{{ settingText.cancel }}</el-button>
                          <el-button
                            v-if="isNginxConfigEditable"
                            type="success"
                            @click="confirmNginxPreview"
                          >
                            {{ settingText.confirm }}
                          </el-button>
                        </div>
                      </div>
                    </el-popover>
                  </el-form-item>
                </el-col>
              </el-row>

              <div class="field-hint" :class="form.nginxChecked ? 'success' : 'warning'">
                {{ form.nginxChecked ? settingText.nginxCheckedHint : settingText.nginxUncheckedHint }}
              </div>
            </template>
          </el-form>
        </div>

        <div v-else-if="currentStep === 6" class="step-content">
          <el-form label-position="top">
            <el-form-item label="是否启用数据库配置">
              <el-switch
                v-model="enableDatabaseConfig"
                active-text="启用"
                inactive-text="不启用"
              />
            </el-form-item>

            <el-form-item v-if="enableDatabaseConfig && hasOriginalDatabaseConfig()" label="是否修改数据库信息">
              <el-switch
                v-model="form.databaseModifyEnabled"
                active-text="修改"
                inactive-text="不修改"
              />
            </el-form-item>

            <el-form-item v-if="enableDatabaseConfig" label="数据库名称">
              <el-input v-model="form.databaseName" :disabled="!isDatabaseConfigEditable" placeholder="例如 my_project" />
            </el-form-item>
            <el-form-item v-if="enableDatabaseConfig" label="数据库IP">
              <el-select
                v-model="form.databaseHost"
                :disabled="!isDatabaseConfigEditable"
                placeholder="可选择或手动输入数据库IP"
                filterable
                allow-create
                default-first-option
                :reserve-keyword="false"
                style="width: 100%"
              >
                <el-option
                  v-for="host in databaseHostOptions"
                  :key="host"
                  :label="host"
                  :value="host"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-if="enableDatabaseConfig" label="数据库端口">
              <el-input v-model="form.databasePort" :disabled="!isDatabaseConfigEditable" placeholder="例如 3306" />
            </el-form-item>
            <el-form-item v-if="enableDatabaseConfig" label="数据库账号">
              <el-input v-model="form.databaseUser" :disabled="!isDatabaseConfigEditable" placeholder="例如 root" />
            </el-form-item>
            <el-form-item v-if="enableDatabaseConfig" label="数据库密码">
              <el-input
                v-model="form.databasePassword"
                :disabled="!isDatabaseConfigEditable"
                type="password"
                show-password
                placeholder="请输入数据库密码"
              />
            </el-form-item>
            <el-form-item v-if="enableDatabaseConfig" label="连接测试">
              <div class="db-check-row">
                <el-button
                  type="primary"
                  :loading="databaseChecking"
                  :disabled="!isDatabaseConfigEditable"
                  @click="checkDatabaseConnectionInSetting"
                >
                  {{ databaseChecked ? '已通过' : 'Check' }}
                </el-button>
                <span class="db-check-hint" :class="{ ok: databaseChecked }">
                  {{ databaseCheckMessage }}
                </span>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div v-else class="step-content">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="项目名称">{{ form.projectName }}</el-descriptions-item>
            <el-descriptions-item label="项目描述">{{ form.description || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="Conda环境">{{ form.condaEnvName || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="项目入口文件位置">{{ selectedEntryText || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="Nginx配置">
              {{ form.nginxEnabled ? '启用' : '不启用' }}
            </el-descriptions-item>
            <template v-if="form.nginxEnabled">
              <el-descriptions-item label="使用的Nginx IP地址">
                {{ form.nginxServerIp || form.serverIp || '未配置' }}
              </el-descriptions-item>
              <el-descriptions-item label="使用的Nginx配置文件地址">
                {{ form.nginxConfPath || '未获取' }}
              </el-descriptions-item>
              <el-descriptions-item label="使用Nginx前端端口">
                {{ form.frontendPort || '未填写' }}
              </el-descriptions-item>
              <el-descriptions-item label="后端部署端口">
                {{ form.backendDeployPort || '未填写' }}
              </el-descriptions-item>
              <el-descriptions-item label="Nginx详细配置预览">
                <el-popover
                  placement="right"
                  :width="560"
                  trigger="hover"
                  :disabled="!form.nginxConfigText"
                  popper-class="nginx-summary-popover"
                >
                  <template #reference>
                    <div class="nginx-summary-trigger" :class="{ empty: !form.nginxConfigText }">
                      <span>{{ form.nginxConfigText ? '已配置' : '未设置' }}</span>
                      <el-icon v-if="form.nginxConfigText" class="nginx-summary-icon">
                        <View />
                      </el-icon>
                    </div>
                  </template>
                  <div class="nginx-preview-editor nginx-summary-popover-content">
                    <div class="nginx-preview-editor__header">配置详细配置信息</div>
                    <el-input
                      :model-value="form.nginxConfigText"
                      type="textarea"
                      disabled
                      :rows="18"
                      resize="vertical"
                    />
                  </div>
                </el-popover>
              </el-descriptions-item>
            </template>
            <el-descriptions-item label="开发启动命令">{{ form.devCommand || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="部署启动命令">{{ form.deployCommand || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="数据库配置">
              {{ enableDatabaseConfig ? '启用' : '不启用' }}
            </el-descriptions-item>
            <template v-if="enableDatabaseConfig">
              <el-descriptions-item label="数据库名称">{{ form.databaseName || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="数据库地址">
                {{ (form.databaseHost || '-') + ':' + (form.databasePort || '-') }}
              </el-descriptions-item>
              <el-descriptions-item label="数据库账号">{{ form.databaseUser || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="数据库密码">
                <span class="summary-password-row">
                  <span>{{ databasePasswordVisible ? (form.databasePassword || '未设置') : maskedDatabasePassword }}</span>
                  <el-icon
                    v-if="form.databasePassword"
                    class="summary-password-icon"
                    @click="databasePasswordVisible = !databasePasswordVisible"
                  >
                    <component :is="databasePasswordVisible ? Hide : View" />
                  </el-icon>
                </span>
              </el-descriptions-item>
            </template>
          </el-descriptions>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="step-index">步骤 {{ currentStep + 1 }} / {{ stepItems.length }}</div>
        <div class="footer-actions">
          <el-button v-if="showResetButton" @click="resetWorkflow">重新设置</el-button>
          <el-button @click="emit('update:modelValue', false)">取消</el-button>
          <el-button v-if="currentStep > 0" @click="goPrev">上一步</el-button>
          <el-button v-if="currentStep < stepItems.length - 1" type="primary" @click="goNext">下一步</el-button>
          <el-button v-else type="primary" @click="onConfirm">确认</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElInput, ElMessage, ElMessageBox } from 'element-plus'
import { Hide, Loading, View } from '@element-plus/icons-vue'
import { projectApi } from '@/api/project'
import { getErrorMessage } from '@/utils/request'
import {
  DB_PORT_MAX,
  DB_PORT_MIN,
  DEFAULT_DB_PASSWORD,
  DEFAULT_DB_PORT,
  DEFAULT_DB_USER,
  PORT_MAX,
  PORT_MIN,
  ROOT_PATH_VALUE,
  settingSteps,
  settingText,
  STEP_COLS,
} from './project-setting/projectSettingConstants'
import {
  buildNginxDirTreeOptions,
  hasNginxWildcard,
  hasText,
  isNginxModulesPath,
  isValidConfFileName,
  joinPath,
  normalizeAbsolutePath,
  sanitizePort,
  stripNginxComments,
} from './project-setting/projectSettingUtils'
import { buildCascaderPathValues } from '@/views/dashboard/composables/dialogUtils'

const props = defineProps(['modelValue', 'width', 'fields', 'form'])
const emit = defineEmits(['update:modelValue', 'confirm'])

const currentStep = ref(0)
const enableDatabaseConfig = ref(false)
const databaseChecked = ref(false)
const databaseChecking = ref(false)
const databasePasswordVisible = ref(false)
const databaseCheckMessage = ref('请先测试数据库连接')
const originalDatabasePolicyHandled = ref(false)
const condaEnvOptions = ref([])
const condaEnvLoading = ref(false)
const condaEnvNameChecked = ref(true)
const condaEnvCheckMessage = ref('')
const condaPolicyHandled = ref(false)
const condaCreateRequired = ref(false)
const condaPythonVersionDraft = ref('')
let condaPolicyPromise = null
const validatingPort = ref(false)
const entryPathCascaderValue = ref([])
const entryPathOptions = ref([])
const configuredOnOpen = ref(false)
const stepperRef = ref(null)
const stepNodeRefs = ref([])
const stepperSize = ref({ width: 1, height: 1 })
const connectorLines = ref([])
let stepperDelayTimer = null

const originalNginxConfig = reactive({
  serverIp: '',
  confPath: '',
  existingConfPath: '',
  frontendPort: '',
  backendDeployPort: '',
  configText: '',
})

const originalDatabaseConfig = reactive({
  name: '',
  host: '',
  port: '',
  user: '',
  password: '',
})

const originalBaseConfig = reactive({
  description: '',
  condaEnvName: '',
  pythonVersion: '',
  entryFilePath: '',
  devCommand: '',
  deployCommand: '',
})

const stepItems = settingSteps

const stepRenderItems = computed(() => {
  return stepItems.map((step, index) => {
    const row = Math.floor(index / STEP_COLS)
    const offset = index % STEP_COLS
    const col = row % 2 === 0 ? offset + 1 : STEP_COLS - offset
    return {
      step,
      index,
      gridStyle: {
        gridRow: String(row + 1),
        gridColumn: String(col),
      },
    }
  })
})

const lastStepIndex = stepItems.length - 1

const currentStepMeta = computed(() => stepItems[currentStep.value] || stepItems[0])
const showResetButton = computed(() => configuredOnOpen.value && currentStep.value === lastStepIndex)

const selectedEntryText = computed(() => {
  const entry = String(props.form?.entryFilePath || '').trim()
  if (!entry) return ''
  return normalizeAbsolutePath(props.form?.backendPath, entry)
})


const hasOriginalEntryFilePath = () => hasText(originalBaseConfig.entryFilePath)
const hasOriginalDevCommand = () => hasText(originalBaseConfig.devCommand)
const hasOriginalDeployCommand = () => hasText(originalBaseConfig.deployCommand)

const isEntryFileEditable = computed(() => {
  if (!hasOriginalEntryFilePath()) return true
  return !!props.form?.entryFilePathModifyEnabled
})

const isDevCommandEditable = computed(() => {
  if (!hasOriginalDevCommand()) return true
  return !!props.form?.devCommandModifyEnabled
})

const isDeployCommandEditable = computed(() => {
  if (!hasOriginalDeployCommand()) return true
  return !!props.form?.deployCommandModifyEnabled
})

const restoreOriginalEntryFilePath = () => {
  if (!props.form) return
  props.form.entryFilePath = originalBaseConfig.entryFilePath
  props.form.entryFilePathCascaderValue = buildCascaderPathValues(originalBaseConfig.entryFilePath)
  entryPathCascaderValue.value = [...props.form.entryFilePathCascaderValue]
}

const restoreOriginalDevCommand = () => {
  if (!props.form) return
  props.form.devCommand = originalBaseConfig.devCommand
}

const restoreOriginalDeployCommand = () => {
  if (!props.form) return
  props.form.deployCommand = originalBaseConfig.deployCommand
}

const maskedDatabasePassword = computed(() => {
  const password = String(props.form?.databasePassword || '')
  return password ? '*'.repeat(Math.max(6, password.length)) : '未设置'
})

const databaseHostOptions = computed(() => {
  const set = new Set()
  const current = String(props.form?.databaseHost || '').trim()
  const serverIp = String(props.form?.serverIp || '').trim()
  const list = Array.isArray(props.form?.serverIpOptions) ? props.form.serverIpOptions : []

  if (serverIp) set.add(serverIp)
  for (const ip of list) {
    const text = String(ip || '').trim()
    if (text) set.add(text)
  }
  if (current) set.add(current)
  return Array.from(set)
})


const hasOriginalDatabaseConfig = () => {
  return hasText(originalDatabaseConfig.name)
}

const originalDatabaseChanged = () => {
  if (!hasOriginalDatabaseConfig()) return false
  return String(props.form?.databaseName || '').trim() !== originalDatabaseConfig.name
    || String(props.form?.databaseHost || '').trim() !== originalDatabaseConfig.host
    || String(props.form?.databasePort || '').trim() !== originalDatabaseConfig.port
    || String(props.form?.databaseUser || '').trim() !== originalDatabaseConfig.user
    || String(props.form?.databasePassword || '') !== originalDatabaseConfig.password
}

const isDatabaseConfigEditable = computed(() => {
  if (!enableDatabaseConfig.value) return false
  if (!hasOriginalDatabaseConfig()) return true
  return !!props.form?.databaseModifyEnabled
})

const serverIpOptions = computed(() => {
  const set = new Set()
  const current = String(props.form?.nginxServerIp || props.form?.serverIp || '').trim()
  const list = Array.isArray(props.form?.serverIpOptions) ? props.form.serverIpOptions : []
  if (current) set.add(current)
  for (const ip of list) {
    const text = String(ip || '').trim()
    if (text) set.add(text)
  }
  return Array.from(set)
})

const nginxExistingConfOptions = computed(() => {
  const list = Array.isArray(props.form?.nginxConfOptions) ? props.form.nginxConfOptions : []
  return list.map((item) => {
    const path = typeof item === 'string' ? item : (item.value || item.path || '')
    const status = typeof item === 'string' ? 'available' : (item.status || 'available')
    const selectable = typeof item === 'string' ? true : item.selectable !== false
    return {
      label: path,
      value: path,
      disabled: status === 'disabled' || !selectable,
      status,
    }
  }).filter((item) => {
    const value = String(item.value || '').trim()
    return !!value && !hasNginxWildcard(value) && !isNginxModulesPath(value)
  })
})

const isNewConfFileInvalid = computed(() => {
  const fileName = String(props.form?.nginxNewConfFileName || '').trim()
  if (!fileName) return false
  return !isValidConfFileName(fileName)
})

const hasExistingConfPath = computed(() => !!String(props.form?.nginxExistingConfPath || '').trim())

const hasNewConfDraft = computed(() => {
  return !!(
    String(props.form?.nginxNewConfBaseDir || '').trim()
    || String(props.form?.nginxNewConfDirPath || '').trim()
    || String(props.form?.nginxNewConfFileName || '').trim()
  )
})

const newConfTip = computed(() => {
  const dir = String(props.form?.nginxNewConfDirPath || '').trim()
  const fileName = String(props.form?.nginxNewConfFileName || '').trim()
  if (!dir && !fileName) return '右侧用于创建新的 .conf 配置文件；与左侧已有配置文件二选一。'
  if (!dir) return '请先选择配置目录。'
  if (!fileName) return `已选择目录：${dir}`
  if (!isValidConfFileName(fileName)) return '文件名必须以 .conf 结尾，且不能包含 / 或 \\。'
  return `最终路径：${joinPath(dir, fileName)}`
})

const selectedNginxDirText = computed(() => String(props.form?.nginxNewConfDirPath || '').trim())

const nginxNewConfDirTreeOptions = computed(() => {
  const list = Array.isArray(props.form?.nginxNewConfDirs) ? props.form.nginxNewConfDirs : []
  return buildNginxDirTreeOptions(list)
})

const nginxDirCascaderProps = {
  emitPath: true,
  checkStrictly: false,
}

const nginxConfSelected = computed(() => !!String(props.form?.nginxConfPath || '').trim())
const isNginxConfigEditable = computed(() => {
  if (!props.form?.nginxEnabled) return false
  if (!hasOriginalNginxConfig()) return true
  return !!props.form?.nginxModifyEnabled
})

const nginxPortFieldsDisabled = computed(() => {
  return !props.form?.nginxEnabled
    || !isNginxConfigEditable.value
    || !props.form?.nginxChecked
    || !nginxConfSelected.value
    || !!props.form?.nginxChecking
})

const canShowNginxPreview = computed(() => {
  if (!props.form?.nginxEnabled) return false
  if (!isNginxConfigEditable.value && hasOriginalNginxConfig()) return hasText(props.form?.nginxConfigText || props.form?.nginxPreviewText)
  if (!props.form?.nginxChecked) return false
  if (!nginxConfSelected.value) return false
  if (!isValidPort(props.form?.frontendPort)) return false
  if (!isValidPort(props.form?.backendDeployPort)) return false
  if (!props.form?.nginxFrontendPortChecked || !props.form?.nginxBackendPortChecked) return false
  return true
})

const willChangeOriginalNginxConfig = () => {
  if (!hasOriginalNginxConfig()) return false
  if (!props.form?.nginxEnabled) return true
  return !!props.form?.nginxModifyEnabled && originalNginxChanged()
}

const willDeleteOriginalConfig = () => {
  return !!props.form?.dropOriginalDatabase
    || !!props.form?.dropOriginalCondaEnv
    || !!props.form?.createCondaEnv
    || willChangeOriginalNginxConfig()
}

const isValidPort = (value) => {
  const text = sanitizePort(value)
  if (!text) return false
  if (!/^\d+$/.test(text)) return false
  const num = Number(text)
  return num >= PORT_MIN && num <= PORT_MAX
}

const isValidDbPort = (value) => {
  const text = sanitizePort(value)
  if (!/^\d+$/.test(text)) return false
  const num = Number(text)
  return num >= DB_PORT_MIN && num <= DB_PORT_MAX
}

const collectEnabledPorts = () => {
  const ports = []
  if (hasText(props.form?.backendDevPort)) {
    ports.push({ label: '后端开发端口', value: sanitizePort(props.form.backendDevPort) })
  }
  if (hasText(props.form?.backendDeployPort)) {
    ports.push({ label: '后端部署端口', value: sanitizePort(props.form.backendDeployPort) })
  }
  if (props.form?.nginxEnabled && hasText(props.form?.frontendPort)) {
    ports.push({ label: 'Nginx前端端口', value: sanitizePort(props.form.frontendPort) })
  }
  return ports
}

const ensurePortsDistinct = () => {
  const ports = collectEnabledPorts()
  const seen = new Map()
  for (const item of ports) {
    if (seen.has(item.value)) {
      const other = seen.get(item.value)
      ElMessage.warning(`${other} 与 ${item.label} 不能相同`)
      return false
    }
    seen.set(item.value, item.label)
  }
  return true
}

const restoreOriginalDescription = () => {
  if (!props.form) return
  props.form.description = originalBaseConfig.description
}

const restoreOriginalCondaEnv = () => {
  if (!props.form) return
  props.form.condaEnvName = originalBaseConfig.condaEnvName
  props.form.pythonVersion = originalBaseConfig.pythonVersion
  props.form.createCondaEnv = false
  props.form.dropOriginalCondaEnv = false
  condaCreateRequired.value = false
  condaPolicyHandled.value = false
  condaEnvNameChecked.value = true
  condaEnvCheckMessage.value = ''
}

const loadCondaEnvOptions = async () => {
  const projectId = Number(props.form?.projectId || 0)
  if (!projectId) return
  try {
    condaEnvLoading.value = true
    const resp = await projectApi.listProjectCondaEnvs(projectId)
    const data = resp.data?.data || {}
    condaEnvOptions.value = Array.isArray(data.envs) ? data.envs.map((x) => String(x || '').trim()).filter(Boolean) : []
  } catch (error) {
    condaEnvOptions.value = []
    ElMessage.warning(getErrorMessage(error, '查询Conda环境列表失败'))
  } finally {
    condaEnvLoading.value = false
  }
}

const isCondaEnvExisting = (value) => {
  const text = String(value || '').trim()
  if (!text) return false
  return condaEnvOptions.value.some((x) => String(x || '').trim() === text)
}

const resetCondaSwitchState = () => {
  condaPolicyHandled.value = false
  condaCreateRequired.value = false
  if (!props.form) return
  props.form.createCondaEnv = false
  props.form.dropOriginalCondaEnv = false
}

const confirmCondaSwitchPolicy = async (isExistingEnv) => {
  if (condaPolicyHandled.value) return true
  if (condaPolicyPromise) return await condaPolicyPromise

  const runConfirm = async () => {
    const original = String(originalBaseConfig.condaEnvName || '').trim()
    if (!original) {
      props.form.dropOriginalCondaEnv = false
      condaPolicyHandled.value = true
      return true
    }
    const nextName = String(props.form?.condaEnvName || '').trim()
    condaPythonVersionDraft.value = String(props.form?.pythonVersion || originalBaseConfig.pythonVersion || '').trim()
    try {
      await ElMessageBox({
        title: 'Conda环境处理',
        type: 'warning',
        customClass: 'original-conda-policy-box',
        distinguishCancelAndClose: true,
        showCancelButton: true,
        confirmButtonText: '保留',
        cancelButtonText: '不保留',
        closeOnClickModal: false,
        beforeClose: (action, instance, done) => {
          if ((action === 'confirm' || action === 'cancel') && !isExistingEnv) {
            const version = String(condaPythonVersionDraft.value || '').trim()
            if (!version) {
              ElMessage.warning('请填写Python版本')
              return
            }
            props.form.pythonVersion = version
          }
          done()
        },
        message: () => h(
          'div',
          { style: 'font-size:14px;line-height:1.8;color:#303133;font-weight:600;padding:2px 0 4px;' },
          [
            h('div', null, `是否保留原【${original}】Conda环境`),
            !isExistingEnv ? h('div', { style: 'margin-top:6px;color:#606266;font-weight:500;' }, `新Conda环境【${nextName}】不存在，请填写Python版本；最终确认后会创建该环境。`) : null,
            !isExistingEnv ? h(ElInput, {
              modelValue: condaPythonVersionDraft.value,
              'onUpdate:modelValue': (value) => {
                condaPythonVersionDraft.value = String(value || '').trim()
              },
              placeholder: '例如 3.10',
              style: 'margin-top:10px;width:100%;',
              clearable: true,
            }) : null,
          ],
        ),
      })
      if (!isExistingEnv) {
        props.form.pythonVersion = String(condaPythonVersionDraft.value || '').trim()
      }
      props.form.dropOriginalCondaEnv = false
      condaPolicyHandled.value = true
      return true
    } catch (action) {
      if (action !== 'cancel') return false
      if (!isExistingEnv) {
        props.form.pythonVersion = String(condaPythonVersionDraft.value || '').trim()
      }
      props.form.dropOriginalCondaEnv = true
      condaPolicyHandled.value = true
      ElMessage.warning(`已选择不保留原【${original}】Conda环境，将在点击确认设置后删除`)
      return true
    }
  }

  condaPolicyPromise = runConfirm()
  try {
    return await condaPolicyPromise
  } finally {
    condaPolicyPromise = null
  }
}

const checkDescriptionChange = () => {
  if (!props.form?.descriptionModifyEnabled) return true
  const value = String(props.form?.description || '').trim()
  const original = String(originalBaseConfig.description || '').trim()
  if (value === original) {
    ElMessage.warning('和原项目描述一样，请修改')
    return false
  }
  return true
}

const checkCondaEnvName = async () => {
  if (!props.form?.condaModifyEnabled) {
    condaEnvNameChecked.value = true
    condaEnvCheckMessage.value = ''
    condaCreateRequired.value = false
    if (props.form) props.form.createCondaEnv = false
    return true
  }
  const value = String(props.form?.condaEnvName || '').trim()
  const original = String(originalBaseConfig.condaEnvName || '').trim()
  if (!value) {
    condaEnvNameChecked.value = false
    condaEnvCheckMessage.value = '请填写Conda环境'
    ElMessage.warning(condaEnvCheckMessage.value)
    return false
  }
  if (value === original) {
    condaEnvNameChecked.value = false
    condaEnvCheckMessage.value = '和原Conda环境一样，请修改'
    ElMessage.warning(condaEnvCheckMessage.value)
    return false
  }

  if (!condaEnvOptions.value.length && !condaEnvLoading.value) {
    await loadCondaEnvOptions()
  }

  const exists = isCondaEnvExisting(value)
  condaCreateRequired.value = !exists
  props.form.createCondaEnv = !exists

  const policyOk = await confirmCondaSwitchPolicy(exists)
  if (!policyOk) {
    condaEnvNameChecked.value = false
    return false
  }

  condaEnvNameChecked.value = true
  condaEnvCheckMessage.value = exists ? '将切换到已有Conda环境' : '将创建新的Conda环境'
  return true
}

const checkPortByBackend = async (portValue, checkNginxConf = false) => {
  const projectId = Number(props.form?.projectId || 0)
  if (!projectId) {
    ElMessage.warning('项目ID缺失，无法校验端口')
    return false
  }
  const text = sanitizePort(portValue)
  if (!/^\d+$/.test(text)) {
    ElMessage.warning('端口必须为数字')
    return false
  }
  const port = Number(text)
  try {
    validatingPort.value = true
    await projectApi.checkProjectPort({
      project_id: projectId,
      port,
      check_nginx_conf: !!checkNginxConf,
      nginx_server_ip: String(props.form?.nginxServerIp || ''),
    })
    return true
  } catch (error) {
    ElMessage.warning(getErrorMessage(error, '端口校验失败'))
    return false
  } finally {
    validatingPort.value = false
  }
}

const ensureDatabaseDefaults = (preferServerIp = false) => {
  if (!props.form) return
  if (!hasText(props.form.databaseName)) {
    props.form.databaseName = String(props.form.projectName || '').trim()
  }
  const serverIp = String(props.form.serverIp || '').trim()
  if (preferServerIp || !hasText(props.form.databaseHost)) {
    props.form.databaseHost = serverIp || databaseHostOptions.value[0] || ''
  }
  if (!hasText(props.form.databasePort)) {
    props.form.databasePort = DEFAULT_DB_PORT
  }
  if (!hasText(props.form.databaseUser)) {
    props.form.databaseUser = DEFAULT_DB_USER
  }
  if (!hasText(props.form.databasePassword)) {
    props.form.databasePassword = DEFAULT_DB_PASSWORD
  }
}

const clearDatabaseFields = () => {
  props.form.databaseName = ''
  props.form.databaseHost = ''
  props.form.databasePort = ''
  props.form.databaseUser = ''
  props.form.databasePassword = ''
}

const captureOriginalDatabaseConfig = () => {
  originalDatabaseConfig.name = String(props.form?.databaseName || '').trim()
  originalDatabaseConfig.host = String(props.form?.databaseHost || '').trim()
  originalDatabaseConfig.port = String(props.form?.databasePort || '').trim()
  originalDatabaseConfig.user = String(props.form?.databaseUser || '').trim()
  originalDatabaseConfig.password = String(props.form?.databasePassword || '')
}

const restoreOriginalDatabaseConfig = () => {
  if (!props.form) return
  props.form.databaseName = originalDatabaseConfig.name
  props.form.databaseHost = originalDatabaseConfig.host
  props.form.databasePort = originalDatabaseConfig.port
  props.form.databaseUser = originalDatabaseConfig.user
  props.form.databasePassword = originalDatabaseConfig.password
  props.form.databaseModifyEnabled = false
  props.form.dropOriginalDatabase = false
  databaseChecked.value = hasOriginalDatabaseConfig()
  databaseCheckMessage.value = databaseChecked.value ? '当前数据库配置未修改，可直接使用' : '请先测试数据库连接'
  originalDatabasePolicyHandled.value = false
}

const captureOriginalNginxConfig = () => {
  originalNginxConfig.serverIp = String(props.form?.nginxServerIp || '').trim()
  originalNginxConfig.confPath = String(props.form?.nginxConfPath || '').trim()
  originalNginxConfig.existingConfPath = String(props.form?.nginxExistingConfPath || props.form?.nginxConfPath || '').trim()
  originalNginxConfig.frontendPort = String(props.form?.frontendPort || '').trim()
  originalNginxConfig.backendDeployPort = String(props.form?.backendDeployPort || '').trim()
  originalNginxConfig.configText = String(props.form?.nginxConfigText || '').trim()
}

const hasOriginalNginxConfig = () => {
  return !!(
    originalNginxConfig.confPath
    || originalNginxConfig.configText
  )
}

const restoreOriginalNginxConfig = () => {
  if (!props.form) return
  props.form.nginxServerIp = originalNginxConfig.serverIp
  props.form.nginxConfPath = originalNginxConfig.confPath
  props.form.nginxExistingConfPath = originalNginxConfig.existingConfPath || originalNginxConfig.confPath
  props.form.frontendPort = originalNginxConfig.frontendPort
  props.form.backendDeployPort = originalNginxConfig.backendDeployPort
  props.form.nginxConfigText = originalNginxConfig.configText
  props.form.nginxPreviewText = originalNginxConfig.configText
  props.form.nginxPreviewDraft = originalNginxConfig.configText
  props.form.nginxPreviewConfirmed = !!originalNginxConfig.configText
  if (originalNginxConfig.confPath) {
    const list = Array.isArray(props.form.nginxConfOptions) ? props.form.nginxConfOptions : []
    const exists = list.some((item) => String((typeof item === 'string' ? item : (item.value || item.path || '')) || '').trim() === originalNginxConfig.confPath)
    if (!exists) {
      props.form.nginxConfOptions = [{ path: originalNginxConfig.confPath, source: 'existing' }, ...list]
    }
  }
  props.form.nginxChecked = !!originalNginxConfig.confPath
  props.form.nginxFrontendPortChecked = !!originalNginxConfig.frontendPort
  props.form.nginxBackendPortChecked = !!originalNginxConfig.backendDeployPort
  props.form.nginxNewConfBaseDir = ''
  props.form.nginxNewConfDirPath = ''
  props.form.nginxNewConfDirCascaderValue = []
  props.form.nginxNewConfFileName = ''
  props.form.dropOriginalNginxConfig = false
  props.form.nginxPreviewVisible = false
}

const clearNginxConfigForEdit = () => {
  if (!props.form) return
  props.form.nginxServerIp = ''
  props.form.nginxConfPath = ''
  props.form.nginxExistingConfPath = ''
  props.form.nginxNewConfBaseDir = ''
  props.form.nginxNewConfDirPath = ''
  props.form.nginxNewConfDirCascaderValue = []
  props.form.nginxNewConfFileName = ''
  props.form.frontendPort = ''
  props.form.backendDeployPort = ''
  props.form.nginxConfigText = ''
  props.form.nginxPreviewText = ''
  props.form.nginxPreviewDraft = ''
  props.form.nginxPreviewConfirmed = false
  props.form.nginxPreviewVisible = false
  props.form.nginxChecked = false
  props.form.nginxChecking = false
  props.form.nginxFrontendPortChecked = false
  props.form.nginxBackendPortChecked = false
  props.form.dropOriginalNginxConfig = false
}

const originalNginxChanged = () => {
  if (!hasOriginalNginxConfig()) return false
  if (!props.form?.nginxEnabled) return true
  return String(props.form?.nginxServerIp || '').trim() !== originalNginxConfig.serverIp
    || String(props.form?.nginxConfPath || '').trim() !== originalNginxConfig.confPath
    || String(props.form?.frontendPort || '').trim() !== originalNginxConfig.frontendPort
    || String(props.form?.backendDeployPort || '').trim() !== originalNginxConfig.backendDeployPort
    || String(props.form?.nginxConfigText || '').trim() !== originalNginxConfig.configText
}

const canReactToNginxEditChange = () => {
  return props.modelValue && props.form?.nginxEnabled && isNginxConfigEditable.value
}

const clearNginxCheckState = (options = {}) => {
  const clearServerIp = !!options.clearServerIp
  const preserveConf = !!options.preserveConf
  const preservedConfPath = preserveConf ? String(props.form?.nginxConfPath || '').trim() : ''
  const preservedExistingConfPath = preserveConf ? String(props.form?.nginxExistingConfPath || preservedConfPath).trim() : ''
  const preservedConfigText = preserveConf ? String(props.form?.nginxConfigText || '').trim() : ''
  if (!props.form) return
  props.form.nginxChecking = false
  props.form.nginxChecked = false
  if (clearServerIp) props.form.nginxServerIp = ''
  props.form.nginxConfPath = preserveConf ? preservedConfPath : ''
  props.form.nginxConfOptions = []
  props.form.nginxNewConfDirs = []
  props.form.nginxExistingConfPath = preserveConf ? preservedExistingConfPath : ''
  props.form.nginxNewConfBaseDir = ''
  props.form.nginxNewConfDirPath = ''
  props.form.nginxNewConfDirCascaderValue = []
  props.form.nginxNewConfFileName = ''
  props.form.nginxFrontendPortChecked = false
  props.form.nginxBackendPortChecked = false
  props.form.nginxPreviewVisible = false
  props.form.nginxConfigText = preservedConfigText
  props.form.nginxPreviewConfirmed = preserveConf && !!preservedConfigText
  props.form.nginxPreviewText = preservedConfigText || buildNginxPreview()
  props.form.nginxPreviewDraft = props.form.nginxPreviewText
}

const handleExistingConfChange = (value) => {
  const form = props.form || {}
  const path = String(value || '').trim()
  if (path) {
    form.nginxNewConfBaseDir = ''
    form.nginxNewConfDirPath = ''
    form.nginxNewConfDirCascaderValue = []
    form.nginxNewConfFileName = ''
  }
  form.nginxConfPath = path
  form.nginxPreviewConfirmed = false
  refreshNginxPreview({ preferSaved: true })
}

const handleNewConfDirCascaderChange = (value) => {
  const form = props.form || {}
  const values = Array.isArray(value) ? value : []
  form.nginxNewConfDirCascaderValue = values
  const last = values.length ? String(values[values.length - 1] || '').trim() : ''
  form.nginxNewConfBaseDir = values.length ? String(values[0] || '').trim() : ''
  form.nginxNewConfDirPath = last
  if (!last) {
    form.nginxNewConfFileName = ''
    form.nginxConfPath = ''
  }
  handleNewConfChange()
}

const handleNewConfDirClear = () => {
  const form = props.form || {}
  form.nginxNewConfDirCascaderValue = []
  form.nginxNewConfBaseDir = ''
  form.nginxNewConfDirPath = ''
  form.nginxNewConfFileName = ''
  form.nginxConfPath = ''
  handleNewConfChange()
}

const handleNewConfChange = () => {
  const form = props.form || {}
  const baseDir = String(form.nginxNewConfBaseDir || '').trim()
  const dirPath = String(form.nginxNewConfDirPath || '').trim()
  const fileName = String(form.nginxNewConfFileName || '').trim()
  if (baseDir || dirPath || fileName) {
    form.nginxExistingConfPath = ''
  }
  if (dirPath && isValidConfFileName(fileName)) {
    form.nginxConfPath = joinPath(dirPath, fileName)
  } else if (baseDir || dirPath || fileName) {
    form.nginxConfPath = ''
  }
  form.nginxPreviewConfirmed = false
  refreshNginxPreview({ preferSaved: true })
}

const getFrontendRoot = () => {
  const projectName = String(props.form?.projectName || '').trim()
  const existing = String(props.form?.frontendPath || '').trim()
  if (existing) return existing
  const username = String(props.form?.currentUsername || 'root').trim() || 'root'
  const role = String(props.form?.currentRole || 'user').trim()
  const baseDir = role === 'root' ? '/root/frontend_dist' : `/home/${username}/frontend_dist`
  return projectName ? `${baseDir}/${projectName}` : baseDir
}

const buildNginxPreview = () => {
  const frontendPort = String(props.form?.frontendPort || '').trim()
  const backendPort = String(props.form?.backendDeployPort || '').trim()
  const nginxIp = String(props.form?.nginxServerIp || '').trim()
  const serverIp = String(props.form?.serverIp || '').trim()
  const frontendRoot = getFrontendRoot()
  return `server {
    listen       ${frontendPort};
    server_name  ${nginxIp};

    location / {
        root   ${frontendRoot};
        index  index.html index.htm;
    }

    location /api {
        proxy_pass   http://${serverIp}:${backendPort}/api;
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Credentials' 'true';
        proxy_buffering off;
        #proxy_set_header Connection "";
        client_body_buffer_size 4096m;
        client_max_body_size 4096m;
        proxy_max_temp_file_size 4096m;
        proxy_send_timeout 1800;
        proxy_read_timeout 1800;
        proxy_next_upstream http_500 http_504 http_502 error timeout invalid_header;
    }

    error_page 404 /404.html;

    location = /40x.html {
    }
}`
}

const refreshNginxPreview = (options = {}) => {
  const form = props.form || {}
  if (form.nginxPreviewConfirmed) return
  const current = options.preferSaved ? String(form.nginxConfigText || '').trim() : ''
  const preview = current || buildNginxPreview()
  form.nginxPreviewText = preview
  form.nginxPreviewDraft = preview
}

const nginxConfigHasListenPort = (text, port) => {
  const portText = String(port || '').trim()
  if (!portText) return false
  const clean = stripNginxComments(text)
  const listenRe = /^\s*listen\s+([^;]+);/gim
  let match = listenRe.exec(clean)
  while (match) {
    const raw = String(match[1] || '')
    if (new RegExp(`(^|[^0-9])${portText}([^0-9]|$)`).test(raw)) return true
    match = listenRe.exec(clean)
  }
  return false
}

const nginxConfigHasProxyPassPort = (text, port) => {
  const portText = String(port || '').trim()
  if (!portText) return false
  const clean = stripNginxComments(text)
  const proxyRe = /^\s*proxy_pass\s+([^;]+);/gim
  let match = proxyRe.exec(clean)
  while (match) {
    const raw = String(match[1] || '')
    if (new RegExp(`:${portText}([^0-9]|$)`).test(raw)) return true
    match = proxyRe.exec(clean)
  }
  return false
}

const openNginxPreview = () => {
  const form = props.form || {}
  form.nginxPreviewDraft = String(form.nginxPreviewText || form.nginxConfigText || buildNginxPreview())
  form.nginxPreviewVisible = true
}

const cancelNginxPreview = () => {
  const form = props.form || {}
  form.nginxPreviewVisible = false
  form.nginxPreviewDraft = String(form.nginxPreviewText || form.nginxConfigText || '')
}

const confirmNginxPreview = async () => {
  const form = props.form || {}
  const draft = String(form.nginxPreviewDraft || '').trim()
  const frontendPort = String(form.frontendPort || '').trim()
  const backendPort = String(form.backendDeployPort || '').trim()
  if (!draft) {
    ElMessage.warning('Nginx详细配置不能为空')
    return
  }
  if (!nginxConfigHasListenPort(draft, frontendPort)) {
    ElMessage.warning(`Nginx详细配置必须包含 listen ${frontendPort}`)
    return
  }
  if (!nginxConfigHasProxyPassPort(draft, backendPort)) {
    ElMessage.warning(`Nginx详细配置必须包含 proxy_pass 后端端口 ${backendPort}`)
    return
  }
  if (hasOriginalNginxConfig() && form.nginxModifyEnabled) {
    try {
      await ElMessageBox.confirm(
        '这会删除原配置信息并使用新的Nginx配置，是否确认？',
        '确认修改Nginx配置',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    } catch {
      return
    }
  }
  form.dropOriginalNginxConfig = !!(hasOriginalNginxConfig() && form.nginxModifyEnabled && originalNginxChanged())
  form.nginxConfigText = draft
  form.nginxPreviewText = draft
  form.nginxPreviewDraft = draft
  form.nginxPreviewConfirmed = true
  form.nginxPreviewVisible = false
}

const checkSettingNginxAvailability = async (showSuccess = true) => {
  if (!props.form?.nginxEnabled) return true
  const serverIp = String(props.form?.serverIp || '').trim()
  const nginxServerIp = String(props.form?.nginxServerIp || '').trim()
  const selectedConfPath = String(props.form?.nginxConfPath || props.form?.nginxExistingConfPath || '').trim()
  const selectedConfigText = String(props.form?.nginxConfigText || '').trim()
  if (!serverIp) {
    ElMessage.warning('项目服务器IP缺失')
    return false
  }
  if (!nginxServerIp) {
    ElMessage.warning('请选择Nginx服务器IP')
    return false
  }
  try {
    clearNginxCheckState({ clearServerIp: false, preserveConf: true })
    props.form.nginxServerIp = nginxServerIp
    props.form.nginxChecking = true
    const resp = await projectApi.checkProjectNginx({
      server_ip: serverIp,
      nginx_server_ip: nginxServerIp,
    })
    const data = resp.data?.data || {}
    const confPath = String(data.conf_path || '')
    const confFiles = Array.isArray(data.conf_files) ? data.conf_files : []
    const newConfDirs = Array.isArray(data.new_conf_dirs) ? data.new_conf_dirs : []
    if (!confPath && !confFiles.length && !newConfDirs.length) {
      ElMessage.warning('请先确认Nginx详细配置')
      clearNginxCheckState({ clearServerIp: false, preserveConf: true })
      return false
    }
    const nextConfOptions = confFiles.length ? [...confFiles] : (confPath ? [{ path: confPath, source: 'main' }] : [])
    if (selectedConfPath && !nextConfOptions.some((item) => String((item.path || item.value || item) || '').trim() === selectedConfPath)) {
      nextConfOptions.unshift({ path: selectedConfPath, source: 'current' })
    }
    props.form.nginxConfOptions = nextConfOptions
    props.form.nginxNewConfDirs = newConfDirs
    if (selectedConfPath) {
      props.form.nginxConfPath = selectedConfPath
      props.form.nginxExistingConfPath = selectedConfPath
    }
    props.form.nginxConfigText = selectedConfigText
    props.form.nginxPreviewText = selectedConfigText || buildNginxPreview()
    props.form.nginxPreviewDraft = props.form.nginxPreviewText
    props.form.nginxPreviewConfirmed = !!selectedConfigText
    props.form.nginxChecked = true
    if (showSuccess) ElMessage.success('Nginx服务可用')
    return true
  } catch (error) {
    clearNginxCheckState({ clearServerIp: false, preserveConf: true })
    ElMessage.error(getErrorMessage(error, 'Nginx服务不可用'))
    return false
  } finally {
    props.form.nginxChecking = false
  }
}

const validateNginxPortPair = () => {
  if (!props.form?.nginxEnabled) return true
  const frontend = String(props.form.frontendPort || '').trim()
  const backend = String(props.form.backendDeployPort || '').trim()
  const serverIp = String(props.form.serverIp || '').trim()
  const nginxIp = String(props.form.nginxServerIp || '').trim()
  if (serverIp && nginxIp && serverIp === nginxIp && frontend && backend && frontend === backend) {
    props.form.nginxFrontendPortChecked = false
    props.form.nginxBackendPortChecked = false
    ElMessage.warning('服务器IP和Nginx服务器IP相同时，Nginx前端端口和后端部署端口不能相同')
    return false
  }
  return true
}

const checkSettingNginxPort = async (kind) => {
  if (!props.form?.nginxEnabled) return true
  if (!hasText(props.form.nginxConfPath)) {
    ElMessage.warning('请先确认Nginx详细配置')
    return false
  }
  const isFrontend = kind === 'frontend'
  const key = isFrontend ? 'frontendPort' : 'backendDeployPort'
  const checkedKey = isFrontend ? 'nginxFrontendPortChecked' : 'nginxBackendPortChecked'
  const label = isFrontend ? 'Nginx前端端口' : '后端部署端口'
  const portText = String(props.form[key] || '').trim()
  props.form[checkedKey] = false
  props.form.nginxPreviewConfirmed = false
  if (!isValidPort(portText)) {
  if (portText) ElMessage.warning(`${label}需在 ${PORT_MIN}-${PORT_MAX} 范围内`)
    return false
  }
  if (!validateNginxPortPair()) return false
  const oldConfigText = String(props.form.nginxConfigText || '').trim()
  try {
    validatingPort.value = true
    await projectApi.checkProjectPort({
      project_id: 0,
      port: Number(portText),
      check_nginx_conf: true,
      nginx_server_ip: String(props.form.nginxServerIp || '').trim(),
    })
    props.form[checkedKey] = true
    props.form.nginxConfigText = ''
    refreshNginxPreview()
    props.form.nginxConfigText = oldConfigText
    ElMessage.success(`${label}可用`)
    return true
  } catch (error) {
    ElMessage.warning(getErrorMessage(error, `${label}校验失败`))
    return false
  } finally {
    validatingPort.value = false
  }
}

const confirmOriginalDatabasePolicy = async () => {
  if (!props.form?.databaseModifyEnabled || !hasOriginalDatabaseConfig() || !originalDatabaseChanged()) {
    if (props.form) props.form.dropOriginalDatabase = false
    return true
  }
  if (originalDatabasePolicyHandled.value) return true

  try {
    await ElMessageBox({
      title: '原数据库处理',
      type: 'warning',
      customClass: 'original-database-policy-box',
      distinguishCancelAndClose: true,
      showCancelButton: true,
      confirmButtonText: '保留',
      cancelButtonText: '不保留',
      closeOnClickModal: false,
      message: () => h(
        'div',
        {
          style: 'font-size:14px;line-height:1.8;color:#303133;font-weight:600;padding:2px 0 4px;',
        },
        '是否保留原数据库，如果选择不保留则会直接删除原数据库。',
      ),
    })
    props.form.dropOriginalDatabase = false
    originalDatabasePolicyHandled.value = true
    return true
  } catch (action) {
    if (action !== 'cancel') return false
    props.form.dropOriginalDatabase = true
    originalDatabasePolicyHandled.value = true
    ElMessage.warning('已选择不保留原数据库，将在点击确认设置后删除')
    return true
  }
}

const checkDatabaseConnectionInSetting = async () => {
  if (!enableDatabaseConfig.value) return true
  if (!isDatabaseConfigEditable.value) return true

  if (!hasText(props.form.databaseHost)) {
    ElMessage.warning('请填写数据库IP')
    return false
  }
  if (!isValidDbPort(props.form.databasePort)) {
    ElMessage.warning(`数据库端口不合法（${DB_PORT_MIN}-${DB_PORT_MAX}）`)
    return false
  }
  if (!hasText(props.form.databaseUser)) {
    ElMessage.warning('请填写数据库账号')
    return false
  }

  try {
    databaseChecking.value = true
    const resp = await projectApi.checkProjectDatabase({
      host: String(props.form.databaseHost || '').trim(),
      port: Number(props.form.databasePort),
      username: String(props.form.databaseUser || '').trim(),
      password: String(props.form.databasePassword || ''),
      database_name: String(props.form.databaseName || '').trim(),
    })
    const data = resp.data?.data || {}
    if (data.can_create === true) {
      const policyOk = await confirmOriginalDatabasePolicy()
      if (!policyOk) {
        databaseChecked.value = false
        databaseCheckMessage.value = '请先测试数据库连接'
        return false
      }
      databaseChecked.value = true
      databaseCheckMessage.value = '连接成功，该数据库不存在，可以创建使用'
      ElMessage.success(databaseCheckMessage.value)
      return true
    }
    databaseChecked.value = false
    databaseCheckMessage.value = '连接成功，但该数据库已经存在，不可创建，请更改数据库名称'
    ElMessage.warning(databaseCheckMessage.value)
    return false
  } catch {
    databaseChecked.value = false
    databaseCheckMessage.value = '连接失败'
    ElMessage.warning(databaseCheckMessage.value)
    return false
  } finally {
    databaseChecking.value = false
  }
}

const resetEntryRoot = () => {
  const backendPath = String(props.form?.backendPath || '').trim()
  entryPathOptions.value = [
    {
      value: ROOT_PATH_VALUE,
      label: backendPath ? `${backendPath}/` : '项目目录/',
      leaf: false,
    },
  ]
}

const clearEntrySelection = () => {
  entryPathCascaderValue.value = []
  props.form.entryFilePathCascaderValue = []
  props.form.entryFilePath = ''
}

const isFullyConfigured = () => {
  return hasText(props.form?.entryFilePath)
}

const isFirstSetup = () => {
  return !hasText(props.form?.devCommand) && !hasText(props.form?.deployCommand)
}

const initWorkflow = () => {
  resetEntryRoot()
  originalBaseConfig.description = String(props.form?.description || '').trim()
  originalBaseConfig.condaEnvName = String(props.form?.condaEnvName || '').trim()
  originalBaseConfig.pythonVersion = String(props.form?.pythonVersion || '').trim()
  originalBaseConfig.entryFilePath = String(props.form?.entryFilePath || '').trim()
  originalBaseConfig.devCommand = String(props.form?.devCommand || '')
  originalBaseConfig.deployCommand = String(props.form?.deployCommand || '')
  props.form.descriptionModifyEnabled = false
  props.form.condaModifyEnabled = false
  props.form.entryFilePathModifyEnabled = false
  props.form.devCommandModifyEnabled = false
  props.form.deployCommandModifyEnabled = false
  props.form.createCondaEnv = false
  props.form.dropOriginalCondaEnv = false
  condaCreateRequired.value = false
  condaPolicyHandled.value = false
  condaEnvNameChecked.value = true
  condaEnvCheckMessage.value = ''
  loadCondaEnvOptions()

  if (!hasOriginalEntryFilePath()) {
    clearEntrySelection()
  } else {
    restoreOriginalEntryFilePath()
  }

  if (typeof props.form?.nginxEnabled !== 'boolean') {
    props.form.nginxEnabled = hasText(props.form?.nginxConfPath)
  }
  props.form.nginxModifyEnabled = false
  props.form.dropOriginalNginxConfig = false
  captureOriginalNginxConfig()
  if (props.form?.nginxEnabled) {
    props.form.nginxChecked = !!hasText(props.form?.nginxConfPath)
    props.form.nginxExistingConfPath = hasText(props.form?.nginxConfPath) ? String(props.form.nginxConfPath || '').trim() : ''
    props.form.nginxPreviewText = String(props.form?.nginxConfigText || '').trim() || buildNginxPreview()
    props.form.nginxPreviewDraft = props.form.nginxPreviewText
    props.form.nginxPreviewConfirmed = !!hasText(props.form?.nginxConfigText)
    props.form.nginxFrontendPortChecked = hasText(props.form?.frontendPort)
    props.form.nginxBackendPortChecked = hasText(props.form?.backendDeployPort)
    if (hasText(props.form?.nginxConfPath)) {
      const exists = Array.isArray(props.form.nginxConfOptions)
        && props.form.nginxConfOptions.some((item) => String((typeof item === 'string' ? item : (item.value || item.path || '')) || '').trim() === String(props.form.nginxConfPath || '').trim())
      if (!exists) {
        props.form.nginxConfOptions = [
          ...(Array.isArray(props.form.nginxConfOptions) ? props.form.nginxConfOptions : []),
          { path: String(props.form.nginxConfPath || '').trim(), source: 'existing' },
        ]
      }
    }
    checkSettingNginxAvailability(false)
  } else {
    props.form.nginxPreviewVisible = false
  }

  enableDatabaseConfig.value = hasText(props.form?.databaseName)
  props.form.databaseModifyEnabled = false
  props.form.dropOriginalDatabase = false
  captureOriginalDatabaseConfig()
  if (enableDatabaseConfig.value) {
    if (hasOriginalDatabaseConfig()) {
      restoreOriginalDatabaseConfig()
    } else {
      ensureDatabaseDefaults(false)
    }
  }
  databaseChecked.value = hasOriginalDatabaseConfig()
  databaseCheckMessage.value = databaseChecked.value ? '当前数据库配置未修改，可直接使用' : '请先测试数据库连接'
  originalDatabasePolicyHandled.value = false
  databasePasswordVisible.value = false

  if (hasOriginalEntryFilePath()) {
    restoreOriginalEntryFilePath()
  }

  configuredOnOpen.value = isFullyConfigured()
  currentStep.value = 0
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      initWorkflow()
      scheduleStepLineUpdate()
      if (stepperDelayTimer) {
        clearTimeout(stepperDelayTimer)
      }
      stepperDelayTimer = setTimeout(() => {
        scheduleStepLineUpdate()
      }, 240)
    } else {
      connectorLines.value = []
      stepNodeRefs.value = []
    }
  },
  { immediate: true },
)

watch(currentStep, () => {
  scheduleStepLineUpdate()
})

watch(stepRenderItems, () => {
  scheduleStepLineUpdate()
})

watch(
  () => props.form?.entryFilePathModifyEnabled,
  (enabled) => {
    if (!props.modelValue || enabled || !hasOriginalEntryFilePath()) return
    restoreOriginalEntryFilePath()
  },
)

watch(
  () => props.form?.devCommandModifyEnabled,
  (enabled) => {
    if (!props.modelValue || enabled || !hasOriginalDevCommand()) return
    restoreOriginalDevCommand()
  },
)

watch(
  () => props.form?.deployCommandModifyEnabled,
  (enabled) => {
    if (!props.modelValue || enabled || !hasOriginalDeployCommand()) return
    restoreOriginalDeployCommand()
  },
)

watch(
  () => props.form?.descriptionModifyEnabled,
  (enabled) => {
    if (!props.modelValue || enabled) return
    restoreOriginalDescription()
  },
)

watch(
  () => props.form?.condaModifyEnabled,
  (enabled) => {
    if (!props.modelValue) return
    if (enabled) {
      loadCondaEnvOptions()
      resetCondaSwitchState()
      condaEnvNameChecked.value = true
      condaEnvCheckMessage.value = ''
    } else {
      restoreOriginalCondaEnv()
    }
  },
)

watch(
  () => props.form?.condaEnvName,
  () => {
    if (!props.modelValue || !props.form?.condaModifyEnabled) return
    resetCondaSwitchState()
    condaEnvNameChecked.value = false
    condaEnvCheckMessage.value = ''
  },
)

watch(
  () => props.form?.pythonVersion,
  () => {
    if (!props.modelValue || !props.form?.condaModifyEnabled || !condaCreateRequired.value || condaPolicyPromise) return
    condaPolicyHandled.value = false
    condaEnvNameChecked.value = false
    condaEnvCheckMessage.value = ''
  },
)

watch(
  () => props.form?.nginxEnabled,
  (enabled) => {
    if (!enabled) {
      props.form.nginxModifyEnabled = false
      if (hasOriginalNginxConfig()) {
        restoreOriginalNginxConfig()
        props.form.nginxEnabled = false
      } else {
        props.form.frontendPort = ''
        props.form.backendDeployPort = ''
        props.form.nginxConfPath = ''
        props.form.nginxServerIp = ''
        props.form.nginxConfigText = ''
        clearNginxCheckState({ clearServerIp: true })
      }
    } else if (hasOriginalNginxConfig() && !props.form.nginxModifyEnabled) {
      restoreOriginalNginxConfig()
    } else if (!hasOriginalNginxConfig()) {
      props.form.nginxModifyEnabled = false
    }
  },
)

watch(
  () => props.form?.nginxModifyEnabled,
  (enabled) => {
    if (!props.modelValue || !props.form?.nginxEnabled || !hasOriginalNginxConfig()) return
    if (enabled) {
      clearNginxConfigForEdit()
    } else {
      restoreOriginalNginxConfig()
    }
  },
)

watch(
  () => props.form?.nginxServerIp,
  (value, oldValue) => {
    if (!canReactToNginxEditChange()) return
    if (String(value || '').trim() !== String(oldValue || '').trim()) {
      clearNginxCheckState({ clearServerIp: false })
      props.form.nginxServerIp = String(value || '').trim()
    }
  },
)

watch(
  () => props.form?.frontendPort,
  (value, oldValue) => {
    if (!canReactToNginxEditChange()) return
    if (String(value || '').trim() === String(oldValue || '').trim()) return
    props.form.nginxFrontendPortChecked = false
    props.form.nginxPreviewConfirmed = false
    refreshNginxPreview()
  },
)

watch(
  () => props.form?.backendDeployPort,
  (value, oldValue) => {
    if (!canReactToNginxEditChange()) return
    if (String(value || '').trim() === String(oldValue || '').trim()) return
    props.form.nginxBackendPortChecked = false
    props.form.nginxPreviewConfirmed = false
    refreshNginxPreview()
  },
)

watch(
  () => [props.form?.serverIp, props.form?.projectName, props.form?.frontendPath],
  () => {
    if (!canReactToNginxEditChange()) return
    props.form.nginxPreviewConfirmed = false
    refreshNginxPreview()
  },
)

watch(enableDatabaseConfig, (enabled) => {
  if (enabled) {
    if (hasOriginalDatabaseConfig() && !props.form.databaseModifyEnabled) {
      restoreOriginalDatabaseConfig()
    } else {
      ensureDatabaseDefaults(false)
      databaseChecked.value = false
    }
  } else {
    props.form.databaseModifyEnabled = false
    props.form.dropOriginalDatabase = false
    if (hasOriginalDatabaseConfig()) {
      restoreOriginalDatabaseConfig()
      enableDatabaseConfig.value = false
    } else {
      clearDatabaseFields()
      databaseChecked.value = false
    }
  }
})

watch(
  () => props.form?.databaseModifyEnabled,
  (enabled) => {
    if (!props.modelValue || !enableDatabaseConfig.value || !hasOriginalDatabaseConfig()) return
    if (enabled) {
      databaseChecked.value = false
      databaseCheckMessage.value = '请先测试数据库连接'
      originalDatabasePolicyHandled.value = false
    } else {
      props.form.dropOriginalDatabase = false
      restoreOriginalDatabaseConfig()
    }
  },
)

watch(
  () => [props.form?.databaseName, props.form?.databaseHost, props.form?.databasePort, props.form?.databaseUser, props.form?.databasePassword],
  () => {
    if (enableDatabaseConfig.value && isDatabaseConfigEditable.value) {
      databaseChecked.value = false
      databaseCheckMessage.value = '请先测试数据库连接'
      originalDatabasePolicyHandled.value = false
    }
  },
)

watch(
  () => props.form?.serverIp,
  () => {
    if (enableDatabaseConfig.value && !hasText(props.form?.databaseHost)) {
      props.form.databaseHost = String(props.form.serverIp || '').trim()
    }
  },
)

onMounted(() => {
  window.addEventListener('resize', scheduleStepLineUpdate)
  scheduleStepLineUpdate()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleStepLineUpdate)
  if (stepperDelayTimer) {
    clearTimeout(stepperDelayTimer)
    stepperDelayTimer = null
  }
})

const loadEntryPathChildren = async (node, resolve, reject) => {
  const projectId = Number(props.form?.projectId || 0)
  if (!projectId) {
    resolve([])
    return
  }

  let relPath = ''
  if (node && node.level > 0) {
    const nodeValue = node.value
    if (nodeValue && nodeValue !== ROOT_PATH_VALUE) {
      relPath = String(nodeValue)
    }
  }

  try {
    const resp = await projectApi.listProjectEntryPathChildren(projectId, relPath)
    const rows = Array.isArray(resp.data?.data) ? resp.data.data : []
    const children = rows.map((item) => ({
      label: item.label,
      value: item.value,
      leaf: !!item.leaf,
    }))
    resolve(children)
  } catch (error) {
    if (typeof reject === 'function') {
      reject()
    } else {
      resolve([])
    }
    ElMessage.error(getErrorMessage(error, '加载入口文件路径失败'))
  }
}

const entryPathProps = {
  lazy: true,
  emitPath: true,
  checkStrictly: false,
  lazyLoad: loadEntryPathChildren,
}

const onEntryClear = () => {
  clearEntrySelection()
}

const onEntryPathChange = (val) => {
  const values = Array.isArray(val) ? val : []
  entryPathCascaderValue.value = values
  props.form.entryFilePathCascaderValue = [...values]

  if (!values.length) {
    props.form.entryFilePath = ''
    return
  }

  const last = values[values.length - 1]
  if (!last || last === ROOT_PATH_VALUE) {
    props.form.entryFilePath = ''
    return
  }

  props.form.entryFilePath = String(last)
}

const stepStatusClass = (index) => {
  if (index < currentStep.value) return 'is-done'
  if (index === currentStep.value) return 'is-active'
  return 'is-pending'
}

const stepRowClass = (index) => {
  const row = Math.floor(index / STEP_COLS)
  return row % 2 === 0 ? 'is-even-row' : 'is-odd-row'
}

const stepTurnClass = (index) => {
  if ((index + 1) % STEP_COLS === 0) return 'is-turn-from'
  if (index % STEP_COLS === 0 && index > 0) return 'is-turn-to'
  return ''
}

const setStepNodeRef = (el, index) => {
  stepNodeRefs.value[index] = el || null
}

function scheduleStepLineUpdate() {
  nextTick(() => {
    requestAnimationFrame(() => {
      updateConnectorLines()
    })
  })
}

function updateConnectorLines() {
  const container = stepperRef.value
  if (!container || typeof container.getBoundingClientRect !== 'function') {
    connectorLines.value = []
    return
  }

  const containerRect = container.getBoundingClientRect()
  stepperSize.value = {
    width: Math.max(1, Math.ceil(containerRect.width)),
    height: Math.max(1, Math.ceil(containerRect.height)),
  }

  const lines = []
  const buildArrowPoints = (fromX, fromY, toX, toY) => {
    const dx = toX - fromX
    const dy = toY - fromY
    const len = Math.hypot(dx, dy)
    if (!len) return ''

    const ux = dx / len
    const uy = dy / len
    const px = -uy
    const py = ux

    const tipOffset = 0
    const arrowLength = 4.8
    const arrowWidth = 2

    const tipX = toX - ux * tipOffset
    const tipY = toY - uy * tipOffset
    const baseX = tipX - ux * arrowLength
    const baseY = tipY - uy * arrowLength
    const leftX = baseX + px * arrowWidth
    const leftY = baseY + py * arrowWidth
    const rightX = baseX - px * arrowWidth
    const rightY = baseY - py * arrowWidth
    return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`
  }
  const startGap = 12
  const endGap = 20
  const verticalDropStartGap = 6
  const verticalDropEndGap = 16
  const turnGap = 16
  for (let index = 0; index < stepItems.length - 1; index += 1) {
    const fromNode = stepNodeRefs.value[index]
    const toNode = stepNodeRefs.value[index + 1]
    if (!fromNode || !toNode) continue

    const fromRect = fromNode.getBoundingClientRect()
    const toRect = toNode.getBoundingClientRect()
    const fromRow = Math.floor(index / STEP_COLS)
    const toRow = Math.floor((index + 1) / STEP_COLS)
    const sameRow = fromRow === toRow
    const isRowTurn = !sameRow && (index + 1) % STEP_COLS === 0

    const fromCenterY = fromRect.top - containerRect.top + fromRect.height / 2
    const toCenterY = toRect.top - containerRect.top + toRect.height / 2
    const fromCenterX = fromRect.left - containerRect.left + fromRect.width / 2
    const toCenterX = toRect.left - containerRect.left + toRect.width / 2
    const fromBottomY = fromRect.bottom - containerRect.top
    const toTopY = toRect.top - containerRect.top

    let path = ''
    if (sameRow) {
      const leftToRight = fromRow % 2 === 0
      const startX = leftToRight
        ? fromRect.right - containerRect.left + startGap
        : fromRect.left - containerRect.left - startGap
      const endX = leftToRight
        ? toRect.left - containerRect.left - endGap
        : toRect.right - containerRect.left + endGap
      path = `M ${startX} ${fromCenterY} L ${endX} ${toCenterY}`
      lines.push({
        key: `${index}-${index + 1}`,
        d: path,
        done: index < currentStep.value,
        arrowPoints: buildArrowPoints(startX, fromCenterY, endX, toCenterY),
      })
      continue
    } else {
      const fromEvenRow = fromRow % 2 === 0
      if (isRowTurn) {
        const startY = fromBottomY + verticalDropStartGap
        const endY = toTopY - verticalDropEndGap
        const verticalX = toCenterX
        path = `M ${verticalX} ${startY} L ${verticalX} ${endY}`
        lines.push({
          key: `${index}-${index + 1}`,
          d: path,
          done: index < currentStep.value,
          arrowPoints: buildArrowPoints(verticalX, startY, verticalX, endY),
        })
        continue
      } else {
        const fromSideX = fromEvenRow
          ? fromRect.right - containerRect.left + startGap
          : fromRect.left - containerRect.left - startGap
        const toSideX = fromEvenRow
          ? toRect.right - containerRect.left + endGap
          : toRect.left - containerRect.left - endGap
        const turnX = fromEvenRow
          ? Math.max(fromSideX, toSideX) + turnGap
          : Math.min(fromSideX, toSideX) - turnGap
        path =
          `M ${fromSideX} ${fromCenterY} ` +
          `L ${turnX} ${fromCenterY} ` +
          `L ${turnX} ${toCenterY} ` +
          `L ${toSideX} ${toCenterY}`
        lines.push({
          key: `${index}-${index + 1}`,
          d: path,
          done: index < currentStep.value,
          arrowPoints: buildArrowPoints(turnX, toCenterY, toSideX, toCenterY),
        })
        continue
      }
    }
  }

  connectorLines.value = lines
}

const validateCurrentStep = async () => {
  if (currentStep.value === 0) {
    return checkDescriptionChange()
  }

  if (currentStep.value === 1) {
    if (props.form?.condaModifyEnabled) {
      return await checkCondaEnvName()
    }
    return true
  }

  if (currentStep.value === 2) {
    if (!hasText(props.form.entryFilePath)) {
      ElMessage.warning('请先选择项目入口文件位置')
      return false
    }
    if (props.form?.entryFilePathModifyEnabled && String(props.form.entryFilePath || '').trim() === originalBaseConfig.entryFilePath) {
      ElMessage.warning('和原项目入口文件一样，请修改')
      return false
    }
    return true
  }

  if (currentStep.value === 3) {
    if (props.form?.devCommandModifyEnabled && String(props.form.devCommand || '').trim() === String(originalBaseConfig.devCommand || '').trim()) {
      ElMessage.warning('和原开发启动命令一样，请修改')
      return false
    }
    return true
  }

  if (currentStep.value === 4) {
    if (props.form?.deployCommandModifyEnabled && String(props.form.deployCommand || '').trim() === String(originalBaseConfig.deployCommand || '').trim()) {
      ElMessage.warning('和原部署启动命令一样，请修改')
      return false
    }
    return true
  }

  if (currentStep.value === 5) {
    if (!props.form?.nginxEnabled) {
      return true
    }
    if (!isNginxConfigEditable.value && hasOriginalNginxConfig()) {
      return true
    }
    if (!hasText(props.form.nginxServerIp)) {
      ElMessage.warning('请选择Nginx服务器IP')
      return false
    }
    if (!props.form.nginxChecked) {
      ElMessage.warning('请先检测Nginx服务')
      return false
    }
    if (!hasText(props.form.nginxConfPath)) {
      ElMessage.warning('请选择已有Nginx配置文件，或新建一个 .conf 配置文件')
      return false
    }
    if (!isValidPort(props.form.frontendPort)) {
      ElMessage.warning(`Nginx前端端口不合法（${PORT_MIN}-${PORT_MAX}）`)
      return false
    }
    if (!isValidPort(props.form.backendDeployPort)) {
      ElMessage.warning(`后端部署端口不合法（${PORT_MIN}-${PORT_MAX}）`)
      return false
    }
    if (!ensurePortsDistinct()) {
      return false
    }
    if (!props.form.nginxFrontendPortChecked) {
      const ok = await checkSettingNginxPort('frontend')
      if (!ok) return false
    }
    if (!props.form.nginxBackendPortChecked) {
      const ok = await checkSettingNginxPort('backend')
      if (!ok) return false
    }
    if (!props.form.nginxPreviewConfirmed || !hasText(props.form.nginxConfigText)) {
      ElMessage.warning('请先确认Nginx详细配置')
      return false
    }
    return true
  }

  if (currentStep.value === 6) {
    if (!enableDatabaseConfig.value) {
      return true
    }
    if (!isDatabaseConfigEditable.value && hasOriginalDatabaseConfig()) {
      return true
    }
    if (!hasText(props.form.databaseName)) {
      ElMessage.warning('请填写数据库名称')
      return false
    }
    if (!hasText(props.form.databaseHost)) {
      ElMessage.warning('请填写数据库IP')
      return false
    }
    if (!isValidDbPort(props.form.databasePort)) {
      ElMessage.warning(`数据库端口不合法（${DB_PORT_MIN}-${DB_PORT_MAX}）`)
      return false
    }
    if (!hasText(props.form.databaseUser)) {
      ElMessage.warning('请填写数据库账号')
      return false
    }
    if (!databaseChecked.value) {
      ElMessage.warning('请先点击 Check 测试数据库连接')
      return false
    }
    return true
  }

  return true
}

const validateBeforeConfirm = async () => {
  if (hasOriginalEntryFilePath() && !props.form?.entryFilePathModifyEnabled) {
    restoreOriginalEntryFilePath()
  }
  if (hasOriginalDevCommand() && !props.form?.devCommandModifyEnabled) {
    restoreOriginalDevCommand()
  }
  if (hasOriginalDeployCommand() && !props.form?.deployCommandModifyEnabled) {
    restoreOriginalDeployCommand()
  }
  if (props.form?.condaModifyEnabled && !hasText(props.form.condaEnvName)) {
    ElMessage.warning('请填写Conda环境')
    return false
  }
  if (!hasText(props.form.entryFilePath)) {
    ElMessage.warning('请先选择项目入口文件位置')
    return false
  }
  if (hasText(props.form.backendDevPort) && !isValidPort(props.form.backendDevPort)) {
    ElMessage.warning(`后端开发端口不合法（${PORT_MIN}-${PORT_MAX}）`)
    return false
  }
  if (hasText(props.form.backendDeployPort) && !isValidPort(props.form.backendDeployPort)) {
    ElMessage.warning(`后端部署端口不合法（${PORT_MIN}-${PORT_MAX}）`)
    return false
  }
  if (props.form?.nginxEnabled) {
    if (!isNginxConfigEditable.value && hasOriginalNginxConfig()) {
      if (!ensurePortsDistinct()) {
        return false
      }
    } else {
      if (!hasText(props.form.nginxServerIp)) {
        ElMessage.warning('请选择Nginx服务器IP')
        return false
      }
      if (!props.form.nginxChecked) {
        ElMessage.warning('请先检测Nginx服务')
        return false
      }
      if (!hasText(props.form.nginxConfPath)) {
        ElMessage.warning('请选择已有Nginx配置文件，或新建一个 .conf 配置文件')
        return false
      }
      if (!isValidPort(props.form.frontendPort)) {
        ElMessage.warning(`Nginx前端端口不合法（${PORT_MIN}-${PORT_MAX}）`)
        return false
      }
      if (!isValidPort(props.form.backendDeployPort)) {
        ElMessage.warning(`后端部署端口不合法（${PORT_MIN}-${PORT_MAX}）`)
        return false
      }
      if (!props.form.nginxFrontendPortChecked) {
        const ok = await checkSettingNginxPort('frontend')
        if (!ok) return false
      }
      if (!props.form.nginxBackendPortChecked) {
        const ok = await checkSettingNginxPort('backend')
        if (!ok) return false
      }
      if (!props.form.nginxPreviewConfirmed || !hasText(props.form.nginxConfigText)) {
        ElMessage.warning('请先确认Nginx详细配置')
        return false
      }
    }
  }
  if (!ensurePortsDistinct()) {
    return false
  }
  if (hasText(props.form.backendDevPort)) {
    const ok = await checkPortByBackend(props.form.backendDevPort, false)
    if (!ok) return false
  }
  if (enableDatabaseConfig.value) {
    if (!isDatabaseConfigEditable.value && hasOriginalDatabaseConfig()) {
      restoreOriginalDatabaseConfig()
    } else if (!hasText(props.form.databaseName)) {
      ElMessage.warning('请填写数据库名称')
      return false
    }
    if (!hasText(props.form.databaseHost)) {
      ElMessage.warning('请填写数据库IP')
      return false
    }
    if (!isValidDbPort(props.form.databasePort)) {
      ElMessage.warning(`数据库端口不合法（${DB_PORT_MIN}-${DB_PORT_MAX}）`)
      return false
    }
    if (!hasText(props.form.databaseUser)) {
      ElMessage.warning('请填写数据库账号')
      return false
    }
    if (isDatabaseConfigEditable.value && !databaseChecked.value) {
      const ok = await checkDatabaseConnectionInSetting()
      if (!ok) return false
    }
  }
  return true
}

const goNext = async () => {
  if (validatingPort.value || databaseChecking.value) return
  if (!(await validateCurrentStep())) return
  if (!props.form?.nginxEnabled) {
    props.form.frontendPort = ''
  }
  if (props.form?.nginxEnabled && !isNginxConfigEditable.value && hasOriginalNginxConfig()) {
    restoreOriginalNginxConfig()
  }
  if (currentStep.value < lastStepIndex) {
    currentStep.value += 1
  }
}

const goPrev = () => {
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

const resetWorkflow = () => {
  currentStep.value = 0
  if (hasOriginalEntryFilePath()) {
    restoreOriginalEntryFilePath()
  } else {
    clearEntrySelection()
  }
}

const onConfirm = async () => {
  if (validatingPort.value || databaseChecking.value) return
  if (!props.form?.nginxEnabled) {
    if (hasOriginalNginxConfig()) {
      props.form.nginxConfPath = ''
      props.form.nginxServerIp = ''
      props.form.frontendPort = ''
      props.form.backendDeployPort = ''
      props.form.nginxConfigText = ''
    } else {
      props.form.frontendPort = ''
    }
  }
  if (!enableDatabaseConfig.value) {
    clearDatabaseFields()
  }
  if (!(await validateBeforeConfirm())) return
  if (willDeleteOriginalConfig()) {
    try {
      await ElMessageBox.confirm(
        '原配置信息将会实际删除，请谨慎操作。',
        '危险操作确认',
        {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          closeOnClickModal: false,
        },
      )
    } catch {
      return
    }
  }
  emit('update:modelValue', false)
  emit('confirm')
}
</script>

<style scoped lang="scss">
.setting-workflow {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.workflow-stepper {
  --step-gap-x: 12px;
  --step-gap-y: 14px;
  --dot-size: 24px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 44px;
  gap: var(--step-gap-y) var(--step-gap-x);
  align-items: center;
  position: relative;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e5eaf3;
  background: linear-gradient(180deg, #f8fbff 0%, #f5f8ff 100%);
}

.stepper-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.stepper-path {
  fill: none;
  stroke: #d6e0f0;
  color: #d6e0f0;
  stroke-width: 2.2;
  stroke-linecap: butt;
  stroke-linejoin: round;
  transition: stroke 0.25s ease, color 0.25s ease;
}

.stepper-path.done {
  stroke: #409eff;
  color: #409eff;
  stroke-dasharray: 8 7;
  animation: stepper-flow 0.9s linear infinite;
}

.stepper-arrow-shape {
  fill: #d6e0f0;
  transition: fill 0.25s ease, opacity 0.25s ease, transform 0.25s ease;
}

.stepper-arrow-shape.done {
  fill: #409eff;
  animation: stepper-arrow-flow 0.9s linear infinite;
}

.step-item {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 44px;
  padding: 0 6px;
  overflow: visible;
  z-index: 2;
}

.step-item.is-even-row {
  justify-content: flex-start;
}

.step-item.is-odd-row {
  justify-content: flex-end;
}

.step-item.is-turn-from {
  justify-content: center !important;
}

.step-item.is-turn-to {
  justify-content: center !important;
}

.step-node {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
}

.step-dot {
  width: var(--dot-size);
  height: var(--dot-size);
  border-radius: 50%;
  border: 1px solid #cdd6e6;
  background: #fff;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.step-label {
  margin-left: 8px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

@keyframes stepper-flow {
  from {
    stroke-dashoffset: 15;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes stepper-arrow-flow {
  0% {
    opacity: 0.65;
    transform: scale(0.96);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.65;
    transform: scale(0.96);
  }
}

.step-item.is-active .step-dot {
  border-color: #2f7cff;
  background: linear-gradient(135deg, #2f7cff 0%, #5ca8ff 100%);
  color: #fff;
  box-shadow: 0 0 0 4px rgba(47, 124, 255, 0.14);
}

.step-item.is-active .step-label {
  color: #1d4ed8;
  font-weight: 600;
}

.step-item.is-done .step-dot {
  border-color: #2f7cff;
  background: #ecf3ff;
  color: #2f7cff;
}

.step-item.is-done .step-label {
  color: #3b82f6;
}

.workflow-card {
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 14px;
  background: #fafcff;
  min-height: 310px;
}

.card-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.step-content {
  min-height: 240px;
}

.entry-picker-block {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-cascader {
  width: 100%;
}

.selected-line {
  min-height: 20px;
  line-height: 20px;
}

.selected-label {
  font-size: 12px;
  color: #909399;
}

.selected-value {
  font-size: 13px;
  color: #303133;
  margin-left: 4px;
}

.db-check-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.db-check-hint {
  font-size: 12px;
  color: #909399;
}

.db-check-hint.ok {
  color: #67c23a;
}

.field-hint {
  width: 100%;
  min-height: 32px;
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #606266;
  font-size: 12px;
  line-height: 1.5;
}

.field-hint.success {
  background: #f0f9eb;
  color: #529b2e;
}

.field-hint.warning {
  background: #fdf6ec;
  color: #b88230;
}

.nginx-conf-chooser {
  width: 100%;
}

.nginx-conf-chooser.is-disabled {
  opacity: 0.78;
}

.nginx-conf-loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #ecf5ff;
  color: #337ecc;
  font-size: 12px;
}

.nginx-conf-card {
  width: 100%;
  height: 100%;
  min-height: 182px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.nginx-conf-card.active {
  border-color: #409eff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.12);
}

.nginx-conf-card.is-card-disabled {
  background: #f7f8fa;
  opacity: 0.68;
}

.nginx-conf-card__title {
  margin-bottom: 10px;
  color: #303133;
  font-size: 13px;
  font-weight: 700;
}

.nginx-conf-preview {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.nginx-conf-preview.danger {
  color: #f56c6c;
}

.nginx-dir-cascader {
  width: 100%;
}

.nginx-preview-editor__header {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #303133;
}

.nginx-preview-editor__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

:deep(.nginx-conf-row) {
  align-items: stretch;
}

:deep(.nginx-conf-col) {
  display: flex;
}

.nginx-summary-trigger {
  width: 100%;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #10b981;
  cursor: pointer;
}

.nginx-summary-trigger.empty {
  color: #94a3b8;
  cursor: default;
}

.nginx-summary-icon {
  flex: none;
  color: #2563eb;
  font-size: 16px;
}

.nginx-summary-popover-content {
  max-width: 560px;
}

.summary-password-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.summary-password-icon {
  cursor: pointer;
  color: #909399;
  font-size: 16px;
  transition: color 0.2s ease;
}

.summary-password-icon:hover {
  color: #409eff;
}

.dialog-footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-index {
  font-size: 12px;
  color: #909399;
}

.footer-actions {
  display: inline-flex;
  gap: 8px;
}
</style>
