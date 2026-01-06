import HeroVideo from '@/components/pages/home/HeroVideo'
import FeaturedCategories from '@/components/pages/home/FeaturedCategories'
import React from 'react'
import HomeCategories from '@/components/pages/home/HomeCategories'
import BottomCarousal from '@/components/pages/home/bottomCarousal'
import Testimonials from '@/components/pages/home/Testimonals'
import SideDesign from '@/components/pages/home/SideDesign'

const HomePage = () => {
  return (
    <>
      <HeroVideo/>
      <FeaturedCategories/>
      <HomeCategories/>
      <BottomCarousal/>
      <Testimonials/>
      <SideDesign/>
    </>
  )
}

export default HomePage