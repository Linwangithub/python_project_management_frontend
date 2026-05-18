import { request } from '@/utils/request'

export const terminalApi = {
  listServers() {
    return request.get('/pspm/terminal/servers')
  },

  createSession(payload) {
    return request.post('/pspm/terminal/sessions/create', payload)
  },

  execute(payload) {
    return request.post('/pspm/terminal/execute', payload)
  },

  complete(payload) {
    return request.post('/pspm/terminal/complete', payload)
  },

  closeSession(payload) {
    return request.post('/pspm/terminal/sessions/close', payload)
  },
}
