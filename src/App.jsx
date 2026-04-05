import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Produto from './pages/Produto'
import Loja from './pages/Loja'
import Orcamento from './pages/Orcamento'
import QuemSomos from './pages/QuemSomos'
import Sustentabilidade from './pages/Sustentabilidade'
import Parceiros from './pages/Parceiros'
import Dashboard from './pages/Dashboard'
import Engenharia from './pages/Engenharia'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produto" element={<Produto />} />
        <Route path="/loja" element={<Loja />} />
        <Route path="/orcamento" element={<Orcamento />} />
        <Route path="/quem-somos" element={<QuemSomos />} />
        <Route path="/sustentabilidade" element={<Sustentabilidade />} />
        <Route path="/parceiros" element={<Parceiros />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/engenharia" element={<Engenharia />} />
      </Routes>
      <Footer />
    </div>
  )
}
