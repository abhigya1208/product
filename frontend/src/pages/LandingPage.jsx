import Navbar from '../components/Navbar';
 import HeroSection from '../components/HeroSection';
 import WhyChooseUs from '../components/WhyChooseUs';
 import AboutUs from '../components/AboutUs';
 import FeedbackSection from '../components/FeedbackSection';
 import Footer from '../components/Footer';
 import { FEE_STRUCTURE } from '../utils/constants';
 import { Link } from 'react-router-dom';
 
 export default function LandingPage() {
   return (
     <div className="min-h-screen">
       <Navbar />
       <HeroSection />
       
       {/* Fees Visibility on Home Page */}
       <section className="py-20 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <span className="inline-block bg-pastel-peach/50 text-dark-grey text-sm font-semibold px-4 py-1.5 rounded-full mb-3">Affordable Excellence</span>
           <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-grey mb-6">Our Monthly Fee Structure</h2>
           <p className="text-mid-grey mb-12 max-w-2xl mx-auto">
             We believe in providing quality education that is accessible to everyone. Here is a glimpse of our competitive fee structure.
           </p>
           
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
             {['NUR', '1', '5', '9', '10'].map((cls) => (
               <div key={cls} className="p-6 rounded-2xl bg-cream border border-gray-100 shadow-soft flex flex-col justify-center">
                 <p className="text-xs font-bold text-mid-grey uppercase mb-1">Class {cls}</p>
                 <p className="text-2xl font-extrabold text-dark-grey">₹{FEE_STRUCTURE[cls]}</p>
               </div>
             ))}
             <div className="p-6 rounded-2xl bg-pastel-peach/20 border border-pastel-peach/30 shadow-soft col-span-2 md:col-span-1 lg:col-span-1 flex flex-col justify-center">
               <p className="text-xs font-bold text-mid-grey uppercase mb-1">Class 11 & 12</p>
               <p className="text-2xl font-extrabold text-dark-grey">₹400 – ₹1200</p>
               <p className="text-[10px] font-bold text-mid-grey uppercase mt-1">Contact to branch</p>
             </div>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link to="/admissions" className="btn-primary">View Full Fee Table</Link>
             <p className="text-xs text-mid-grey italic max-w-xs">
               *11 & 12 estimated range: ₹400 to ₹1200 per month
             </p>
           </div>
         </div>
       </section>
 
       <WhyChooseUs />
       <AboutUs />
       <FeedbackSection />
       <Footer />
     </div>
   );
 }
