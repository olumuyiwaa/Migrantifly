
import Header from '../components/Header'
import Hero from '../components/Hero'
import WhyChoose from '../components/WhyChoose'
import MigrationProcess from '../components/MigrationProcess'
import Services from '../components/Services'
import Testimonials from '../components/Testimonials'
import CallToAction from '../components/CallToAction'
import CountryOptions from '../components/CountryOptions'
import Stats from '../components/Stats'
import BlogSection from '../components/Blog'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <WhyChoose />
      <MigrationProcess />
      <Services />
      <Testimonials />
      <CallToAction />
      <CountryOptions />
      <Stats />
      <BlogSection />
      <Footer />
    </main>
  )
}