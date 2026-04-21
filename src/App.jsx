import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import OurStory from './pages/OurStory'
import Information from './pages/Information'
import Registry from './pages/Registry'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-svh flex flex-col bg-paper">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/story" element={<OurStory />} />
          <Route path="/information" element={<Information />} />
          <Route path="/registry" element={<Registry />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
