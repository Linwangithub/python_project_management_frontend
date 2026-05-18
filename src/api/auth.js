import { request } from '@/utils/request'

export const authApi = {
  login(payload) {
    return request.post('/login', payload)
  },
  register(payload) {
    return request.post('/register', payload)
  },
  me() {
    return request.get('/user/me')
  },
  myPermissions() {
    return request.get('/rbac/permissions/me')
  },
}
