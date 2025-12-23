import AboutHero from "@/components/pages/about/AboutHero";
import AboutEditorial from "@/components/pages/about/AboutEditorial";
import AboutAction from "@/components/pages/about/AboutAction";
import AboutGallery from "@/components/pages/about/AboutGallery";

const About = () => {
  return (
    <div>
       <main className="bg-white">
      <AboutHero />
      <AboutGallery/>
      <AboutEditorial />
      <AboutAction />
    </main>
    </div>
  )
}

export default About