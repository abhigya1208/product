import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AcademicsPage() {
  const levels = [
    {
      title: 'Foundation (Nursery - UKG)',
      focus: 'Social skills, motor skills, basic literacy & numeracy.',
      details: 'Our play-way method ensures learning is fun and stress-free for the tiny tots.'
    },
    {
      title: 'Primary (Class 1 - 5)',
      focus: 'Strong fundamentals in Languages, Math, and EVS.',
      details: 'Building the core foundations of analytical thinking and language proficiency.'
    },
    {
      title: 'Middle (Class 6 - 8)',
      focus: 'Broad subjects including Science and Social Studies.',
      details: 'Transitioning to more specialized subject knowledge and regular revision.'
    },
    {
      title: 'Secondary (Class 9 - 10)',
      focus: 'CBSE Curriculum, Board preparation.',
      details: 'Intensive coaching with weekly tests and parent updates to ensure board success.'
    },
    {
      title: 'Sr. Secondary (Class 11 - 12)',
      focus: 'Specialized streams (Science, Commerce, Arts).',
      details: 'Subject-specific expert guidance to prepare for higher education and competitive goals.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block bg-pastel-peach/50 dark:bg-orange-950/30 text-dark-grey dark:text-orange-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Academic Programs</span>
          <h1 className="text-4xl font-extrabold text-dark-grey dark:text-white mb-6">Nursery to Class 12 Curriculum</h1>
          <p className="text-lg text-mid-grey dark:text-gray-400 max-w-2xl mx-auto">
            At AGS Tutorial, we follow a student-centric curriculum designed to foster academic excellence and overall personality development.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {levels.map((lvl, i) => (
            <div key={i} className="card p-8 hover:-translate-y-2 transition-all">
              <h3 className="text-xl font-bold text-dark-grey dark:text-gray-100 mb-4 border-b-2 border-pastel-green pb-2 inline-block">{lvl.title}</h3>
              <p className="font-semibold text-green-600 dark:text-green-400 text-sm mb-3">{lvl.focus}</p>
              <p className="text-mid-grey dark:text-gray-400 text-sm leading-relaxed">{lvl.details}</p>
            </div>
          ))}
        </div>

        <div className="bg-cream dark:bg-slate-900 rounded-3xl p-10 lg:p-16 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-extrabold text-dark-grey dark:text-white mb-6">Our Teaching Methodology</h2>
            <ul className="space-y-4 text-mid-grey dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Concept Clarity:</strong> We believe in "how" and "why" rather than "what".</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Regular Assessments:</strong> Weekly tests to track progress and identify gaps.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Small Batches:</strong> Personalized attention to every single student.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Parent Portal:</strong> Real-time updates on attendance and performance.</span>
              </li>
            </ul>
          </div>
          <div className="lg:w-1/2 grid grid-cols-2 gap-4 w-full">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft dark:shadow-none text-center">
              <p className="text-3xl mb-2">⭐</p>
              <p className="font-bold text-dark-grey dark:text-white">100%</p>
              <p className="text-xs text-mid-grey dark:text-gray-400">Board Results</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft dark:shadow-none text-center">
              <p className="text-3xl mb-2">🎓</p>
              <p className="font-bold text-dark-grey dark:text-white">Expert</p>
              <p className="text-xs text-mid-grey dark:text-gray-400">Faculty</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft dark:shadow-none text-center">
              <p className="text-3xl mb-2">📚</p>
              <p className="font-bold text-dark-grey dark:text-white">Study</p>
              <p className="text-xs text-mid-grey dark:text-gray-400">Material</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft dark:shadow-none text-center">
              <p className="text-3xl mb-2">📈</p>
              <p className="font-bold text-dark-grey dark:text-white">Tracked</p>
              <p className="text-xs text-mid-grey dark:text-gray-400">Growth</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
