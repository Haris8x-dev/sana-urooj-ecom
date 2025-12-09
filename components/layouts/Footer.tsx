export default function Footer() {
  return (
    <footer className="bg-black/90 backdrop-blur-sm py-12">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-white text-sm mb-2">
          © {new Date().getFullYear()} Oceanova. All rights reserved.
        </p>
        <p className="text-white text-xs">Crafted with precision and care</p>
      </div>
    </footer>
  );
}
