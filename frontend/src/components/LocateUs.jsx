export default function LocateUs() {
  return (
    <section id="locate" className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block bg-pastel-peach/60 text-dark-grey text-sm font-semibold px-4 py-1.5 rounded-full mb-3">Find Us</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-grey">Locate Us</h2>
          <p className="mt-3 text-mid-grey">A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi – 110094</p>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-card border border-gray-100 h-80 sm:h-96">
          <iframe
            title="AGS Tutorial Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src="https://maps.google.com/maps?q=Sonia+Vihar+Delhi&t=&z=15&ie=UTF8&iwloc=&output=embed"
          />
        </div>
        <p className="text-center text-sm text-mid-grey mt-4">
          📍 A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi
        </p>
      </div>
    </section>
  );
}
