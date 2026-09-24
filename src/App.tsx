import { createHashRouter, RouterProvider } from 'react-router'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Recommender } from '@/pages/Recommender'
import { Comparator } from '@/pages/Comparator'
import { Market } from '@/pages/Market'
import { Methodology } from '@/pages/Methodology'

// Hash routing: funciona en cualquier hosting estático sin configurar
// reescrituras de rutas (las URLs quedan como /#/comparador).
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'recomendador', element: <Recommender /> },
      { path: 'comparador', element: <Comparator /> },
      { path: 'mercado', element: <Market /> },
      { path: 'metodologia', element: <Methodology /> },
      { path: '*', element: <Home /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
