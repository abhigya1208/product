export default function AboutUs() {
  return (
    <section id="about" className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left: story */}
          <div>
            <span className="inline-block bg-pastel-green/50 text-dark-grey text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Our Story</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-grey mb-5">About AGS Tutorial</h2>
            <p className="text-mid-grey leading-relaxed mb-4">
              AGS Tutorial was founded with a single dream — to give every child in the neighbourhood access to quality education at an affordable fee. Located in Sonia Vihar, Delhi, we have been guiding students from Nursery to Class 12 since 2022.
            </p>
            <p className="text-mid-grey leading-relaxed mb-4 font-semibold text-green-600">
              ✓ 100% passing result for board students since opening (2022).
            </p>
            <p className="text-mid-grey leading-relaxed mb-6">
              Our small batch model ensures that no student is left behind. Our teachers don't just teach subjects — they build relationships, mentor students, and celebrate every milestone. Hundreds of families have trusted us with their children's futures, and we take that responsibility seriously every single day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-white rounded-2xl p-5 shadow-soft border border-gray-100 text-center">
                <p className="text-2xl font-extrabold text-dark-grey">500+</p>
                <p className="text-sm text-mid-grey mt-1">Students Taught</p>
              </div>
              <div className="flex-1 bg-white rounded-2xl p-5 shadow-soft border border-gray-100 text-center">
                <p className="text-2xl font-extrabold text-dark-grey">4+</p>
                <p className="text-sm text-mid-grey mt-1">Years Experience</p>
              </div>
              <div className="flex-1 bg-white rounded-2xl p-5 shadow-soft border border-gray-100 text-center">
                <p className="text-2xl font-extrabold text-dark-grey">100%</p>
                <p className="text-sm text-mid-grey mt-1">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Right: mission & vision cards */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-7 shadow-card border-l-4 border-pastel-green">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-dark-grey mb-2">Our Mission</h3>
              <p className="text-mid-grey leading-relaxed">
                To provide affordable, high-quality education that empowers every student with knowledge, confidence, and values — preparing them to excel in academics and life.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-7 shadow-card border-l-4 border-pastel-peach-dark">
              <div className="text-3xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-dark-grey mb-2">Our Vision</h3>
              <p className="text-mid-grey leading-relaxed">
                To be the most trusted and preferred learning centre in Delhi — where every child discovers their potential and is guided to achieve it with love, discipline, and excellence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
