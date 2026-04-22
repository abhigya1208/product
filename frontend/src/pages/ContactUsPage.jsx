import Navbar from '../components/Navbar';
import ContactForm from '../components/ContactForm';
import LocateUs from '../components/LocateUs';
import Footer from '../components/Footer';

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      <ContactForm />
      <LocateUs />

      <div className="bg-cream py-16 px-4">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          <div className="card">
            <div className="text-3xl mb-3">📞</div>
            <h3 className="font-bold text-dark-grey">Call Us</h3>
            <p className="text-mid-grey">9839910481</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-3">✉️</div>
            <h3 className="font-bold text-dark-grey">Email Us</h3>
            <p className="text-mid-grey text-sm">agstutorial050522@gmail.com</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-3">📍</div>
            <h3 className="font-bold text-dark-grey">Visit Us</h3>
            <p className="text-mid-grey text-xs">A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
