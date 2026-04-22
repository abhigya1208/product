const features = [
  {
    icon: '🎓',
    title: 'Expert Faculty',
    desc: 'Our experienced teachers bring subject mastery and passion, ensuring every student gets the best guidance.'
  },
  {
    icon: '👥',
    title: 'Small Batch Sizes',
    desc: 'Limited seats per batch ensures personalized attention for every child, accelerating their learning.'
  },
  {
    icon: '📚',
    title: 'Comprehensive Curriculum',
    desc: 'We follow CBSE‑aligned curriculum from Nursery to Class 12 with regular revision and practice tests.'
  },
  {
    icon: '💡',
    title: 'Concept-Based Learning',
    desc: 'We focus on building strong fundamentals through conceptual clarity, not rote memorization.'
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    desc: "Regular assessments and parent updates keep families informed about their child's academic growth."
  },
  {
    icon: '❤️',
    title: 'Nurturing Environment',
    desc: 'A safe, friendly and motivating atmosphere that builds confidence alongside academic excellence.'
  },
];

export default function WhyChooseUs() {
  return (
    <section id="why" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block bg-pastel-peach/50 text-dark-grey text-sm font-semibold px-4 py-1.5 rounded-full mb-3">Why AGS Tutorial?</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-grey">What Makes Us Different</h2>
          <p className="mt-3 text-mid-grey max-w-xl mx-auto">Committed to providing quality education and shaping bright futures since 2022.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-pastel-green hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-white">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">{f.icon}</div>
              <h3 className="text-lg font-bold text-dark-grey mb-2">{f.title}</h3>
              <p className="text-mid-grey text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
