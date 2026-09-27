import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// 不用 StrictMode：开发态双挂载会让 webgl-liquid-glass 在同一 canvas 上二次 getContext
// （loseContext 后上下文不可恢复），着色器编译报 "Shader compile: null"
createRoot(document.getElementById('root')!).render(<App />)
