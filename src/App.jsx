import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Modules from './components/Modules'
import Quiz from './components/Quiz'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Modules />
        <Quiz />
      </main>
      <Footer />
    </div>
  )
}

export default App
