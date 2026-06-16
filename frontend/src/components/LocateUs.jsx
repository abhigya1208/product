export default function LocateUs() {
  const mapQuery = encodeURIComponent('AGS Tutorial, A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi 110094');

  return (
    <section id="locate" className="py-20 bg-cream dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block bg-pastel-peach/60 dark:bg-orange-950/30 text-dark-grey dark:text-orange-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">Find Us</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-grey dark:text-white">Locate Us</h2>
          <p className="mt-3 text-mid-grey dark:text-gray-400">A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi – 110094</p>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-card border border-gray-100 dark:border-slate-800 h-80 sm:h-96">
          <iframe
            title="AGS Tutorial Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=18&ie=UTF8&iwloc=&output=embed`}
          />
        </div>
        <p className="text-center text-sm text-mid-grey dark:text-gray-400 mt-4">
          📍 A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi
        </p>
      </div>
    </section>
  );
}
