import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import WhyChooseUs from '../components/WhyChooseUs';
import AboutUs from '../components/AboutUs';
import ContactForm from '../components/ContactForm';
import LocateUs from '../components/LocateUs';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <WhyChooseUs />
      <AboutUs />
      <ContactForm />
      <LocateUs />
      <Footer />
    </div>
  );
}
