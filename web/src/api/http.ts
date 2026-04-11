import axios from 'axios'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const rawMsg = err.response?.data?.message ?? err.message
    const msg =
      rawMsg === 'Network Error' || !rawMsg ? '网络异常，请稍后重试' : rawMsg
    return Promise.reject(new Error(msg))
  },
)

export default http
