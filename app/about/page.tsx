import AboutHero from "@/components/pages/about/AboutHero";
import AboutGallery from "@/components/pages/about/AboutGallery";
import AboutPhilosophy from "@/components/pages/about/AboutPhilosphy";

const About = () => {
  return (
    <div>
       <main className="bg-white">
      <AboutHero />
      <AboutGallery/>
      <AboutPhilosophy/>
    </main>
    </div>
  )
}

export default About