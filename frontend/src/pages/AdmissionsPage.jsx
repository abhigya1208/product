import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FEE_STRUCTURE, CLASSES } from '../utils/constants';

export default function AdmissionsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block bg-pastel-green/50 text-dark-grey text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Admissions 2026-27</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-dark-grey mb-6">Enroll Your Child Today</h1>
          <p className="text-lg text-mid-grey max-w-2xl mx-auto">
            Admissions are currently open for the academic session 2026-27. Join the AGS Tutorial family and give your child the best academic foundation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Fee Structure */}
          <div className="card p-8 bg-white shadow-card border-t-4 border-pastel-green">
            <h2 className="text-2xl font-bold text-dark-grey mb-6 flex items-center gap-2">
              <span>💳</span> Monthly Fee Structure
            </h2>
            <div className="space-y-3">
              {CLASSES.map((cls) => {
                const fee = FEE_STRUCTURE[cls];
                return (
                  <div key={cls} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-dark-grey">Class {cls}</span>
                    {fee > 0 ? (
                      <span className="font-bold text-green-600">₹{fee} <span className="text-xs font-normal text-mid-grey">/ month</span></span>
                    ) : (
                      <div className="flex items-center gap-2 text-right">
                        <span className="font-bold text-green-600">₹400 – ₹1200</span>
                        <span className="text-[10px] uppercase font-bold text-mid-grey mt-0.5">(Contact to branch)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admission Process */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-dark-grey">Admission Process</h2>
            
            <div className="relative pl-8 border-l-2 border-dashed border-pastel-green space-y-10">
              <div className="relative">
                <span className="absolute -left-[41px] top-0 w-5 h-5 bg-pastel-green rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                <h3 className="font-bold text-lg text-dark-grey mb-2">Visit Branch</h3>
                <p className="text-mid-grey text-sm">Visit our Sonia Vihar branch for a detailed discussion with our academic coordinators.</p>
              </div>
              
              <div className="relative">
                <span className="absolute -left-[41px] top-0 w-5 h-5 bg-pastel-green rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                <h3 className="font-bold text-lg text-dark-grey mb-2">Assessment</h3>
                <p className="text-mid-grey text-sm">The student will undergo a basic assessment to understand their current level and learning needs.</p>
              </div>
              
              <div className="relative">
                <span className="absolute -left-[41px] top-0 w-5 h-5 bg-pastel-green rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                <h3 className="font-bold text-lg text-dark-grey mb-2">Registration</h3>
                <p className="text-mid-grey text-sm">Fill the admission form and submit required documents (Aadhar, Photo, Previous Marks-sheet).</p>
              </div>
              
              <div className="relative">
                <span className="absolute -left-[41px] top-0 w-5 h-5 bg-pastel-green rounded-full flex items-center justify-center text-[10px] font-bold">4</span>
                <h3 className="font-bold text-lg text-dark-grey mb-2">Batch Allotment</h3>
                <p className="text-mid-grey text-sm">Once registration is complete, the student will be allotted a suitable batch and time slot.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
              <h3 className="font-bold text-dark-grey mb-3">Questions?</h3>
              <p className="text-sm text-mid-grey mb-4">Feel free to call our helpdesk for any admission related queries.</p>
              <a href="tel:9839910481" className="btn-primary inline-block text-sm">Call 9839910481</a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
