<template>
  <div class="login-page">
    <div class="login-bg login-bg-one"></div>
    <div class="login-bg login-bg-two"></div>

    <el-card class="login-card" shadow="always">
      <div class="login-header">
        <div class="logo">PM</div>
        <div>
          <h1>{{ appName }}</h1>
        
        </div>
      </div>

      <el-tabs v-model="activeTab" stretch class="auth-tabs">
        <el-tab-pane :label="AUTH_VIEW_TEXT.loginTab" name="login">
          <el-form class="auth-form" label-position="top" autocomplete="off" @keyup.enter="onLogin">
            <el-form-item :label="AUTH_VIEW_TEXT.usernameLabel">
              <el-input v-model="loginForm.username" size="large" clearable autocomplete="off" :placeholder="AUTH_VIEW_TEXT.usernamePlaceholder" />
            </el-form-item>
            <el-form-item :label="AUTH_VIEW_TEXT.passwordLabel">
              <el-input v-model="loginForm.password" size="large" type="password" autocomplete="new-password" show-password :placeholder="AUTH_VIEW_TEXT.passwordPlaceholder" />
            </el-form-item>
            <el-button class="submit-btn" size="large" type="primary" :loading="submitting" @click="onLogin">
              {{ AUTH_VIEW_TEXT.loginButton }}
            </el-button>
            
          </el-form>
        </el-tab-pane>

        <el-tab-pane :label="AUTH_VIEW_TEXT.registerTab" name="register">
          <el-form class="auth-form" label-position="top" autocomplete="off" @keyup.enter="onRegister">
            <el-form-item :label="AUTH_VIEW_TEXT.usernameLabel">
              <el-input v-model="registerForm.username" size="large" clearable autocomplete="off" :placeholder="AUTH_VIEW_TEXT.newUsernamePlaceholder" />
            </el-form-item>
            <el-form-item :label="AUTH_VIEW_TEXT.passwordLabel">
              <el-input v-model="registerForm.password" size="large" type="password" autocomplete="new-password" show-password :placeholder="AUTH_VIEW_TEXT.passwordPlaceholder" />
            </el-form-item>
            <el-button class="submit-btn" size="large" type="primary" :loading="submitting" @click="onRegister">
              {{ AUTH_VIEW_TEXT.registerButton }}
            </el-button>
         
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { appConfig } from '@/config/app/app.config'
import { AUTH_MESSAGES, AUTH_VIEW_TEXT } from '@/config/auth/auth.config'
import { useAuthStore } from '@/stores/auth'

const appName = appConfig.appName
const auth = useAuthStore()
const router = useRouter()

const activeTab = ref('login')
const submitting = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const registerForm = reactive({
  username: '',
  password: '',
})

const resetForms = () => {
  loginForm.username = ''
  loginForm.password = ''
  registerForm.username = ''
  registerForm.password = ''
}

onMounted(() => {
  resetForms()
  nextTick(resetForms)
})

const onLogin = async () => {
  const username = loginForm.username.trim()
  const password = loginForm.password.trim()
  if (!username) return ElMessage.warning(AUTH_MESSAGES.USERNAME_REQUIRED)
  if (!password) return ElMessage.warning(AUTH_MESSAGES.PASSWORD_REQUIRED)

  submitting.value = true
  const result = await auth.login({ username, password })
  submitting.value = false

  if (!result.ok) {
    ElMessage.error(result.message || AUTH_MESSAGES.LOGIN_FAILED)
    if ((result.message || '').includes(AUTH_MESSAGES.ACCOUNT_NOT_EXISTS)) {
      registerForm.username = username
      registerForm.password = password
      activeTab.value = 'register'
    }
    return
  }
  ElMessage.success(AUTH_MESSAGES.LOGIN_SUCCESS)
  router.push('/dashboard')
}

const onRegister = async () => {
  const username = registerForm.username.trim()
  const password = registerForm.password.trim()
  if (!username) return ElMessage.warning(AUTH_MESSAGES.USERNAME_REQUIRED)
  if (!password) return ElMessage.warning(AUTH_MESSAGES.PASSWORD_REQUIRED)

  submitting.value = true
  const result = await auth.register({ username, password })
  submitting.value = false

  if (!result.ok) {
    ElMessage.error(result.message || AUTH_MESSAGES.REGISTER_FAILED)
    return
  }
  ElMessage.success(result.message || AUTH_MESSAGES.REGISTER_SUCCESS)
  loginForm.username = username
  loginForm.password = password
  activeTab.value = 'login'
}
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(circle at top left, rgba(67, 110, 255, 0.18), transparent 34%), #07111f;
}

.login-bg {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.36;
}

.login-bg-one {
  top: -120px;
  right: 12%;
  background: #2f80ff;
}

.login-bg-two {
  bottom: -140px;
  left: 10%;
  background: #20d3a2;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 430px;
  border: 1px solid rgba(129, 156, 198, 0.28);
  border-radius: 18px;
  background: rgba(11, 20, 36, 0.92);
  backdrop-filter: blur(12px);
}

.login-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.logo {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #3478ff, #18c99a);
  box-shadow: 0 14px 30px rgba(35, 119, 255, 0.28);
}

.login-header h1 {
  margin: 0;
  color: #eef5ff;
  font-size: 22px;
  line-height: 1.3;
}

.login-header p {
  margin: 4px 0 0;
  color: #8ea5c4;
  font-size: 13px;
}

.auth-tabs :deep(.el-tabs__item) {
  color: #9fb4d3;
  font-weight: 600;
}

.auth-tabs :deep(.el-tabs__item.is-active) {
  color: #6aa0ff;
}

.auth-form {
  padding-top: 8px;
}

.auth-form :deep(.el-form-item__label) {
  color: #c9d8ef;
  font-weight: 600;
}


.auth-form :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 10px;
  background: #eef2f7;
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.72) inset;
}

.auth-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.9) inset;
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  background: #f8fafc;
  box-shadow: 0 0 0 1px #409eff inset, 0 0 0 3px rgba(64, 158, 255, 0.16);
}

.auth-form :deep(.el-input__inner) {
  color: #111827;
  font-weight: 600;
  caret-color: #111827;
}

.auth-form :deep(.el-input__inner::placeholder) {
  color: #8a96a8;
  font-weight: 400;
}

.auth-form :deep(.el-input__suffix),
.auth-form :deep(.el-input__prefix) {
  color: #475569;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
  border-radius: 10px;
  font-weight: 700;
}


</style>
