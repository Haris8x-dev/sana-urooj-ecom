import AboutHero from "@/components/pages/about/AboutHero";
import AboutEditorial from "@/components/pages/about/AboutEditorial";
import AboutAction from "@/components/pages/about/AboutAction";
import React from 'react'
import AboutGallery from "@/components/pages/about/AboutGallery";

const About = () => {
  return (
    <div>
       <main className="bg-white">
      <AboutHero />
      <div className="h-24 bg-white" /> {/* Spacer */}
      <AboutGallery/>
      <AboutEditorial />
      <AboutAction />
    </main>
    </div>
  )
}

export default About