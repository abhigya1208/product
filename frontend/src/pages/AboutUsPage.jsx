import Navbar from '../components/Navbar';
import AboutUs from '../components/AboutUs';
import WhyChooseUs from '../components/WhyChooseUs';
import Footer from '../components/Footer';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-10 px-4 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-dark-grey mb-4">About AGS Tutorial</h1>
        <p className="text-mid-grey max-w-2xl mx-auto italic">
          "Quality coaching for Nursery to Class 12. 100% passing result for board students since opening (2022)."
        </p>
      </div>
      <AboutUs />
      <WhyChooseUs />
      <Footer />
    </div>
  );
}
