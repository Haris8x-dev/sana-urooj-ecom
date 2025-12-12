import HeroVideo from '@/components/pages/home/HeroVideo'
import FeaturedCategories from '@/components/pages/home/FeaturedCategories'
import React from 'react'
import HomeCategories from '@/components/pages/home/HomeCategories'

const HomePage = () => {
  return (
    <>
      <HeroVideo/>
      <FeaturedCategories/>
      <HomeCategories/>
    </>
  )
}

export default HomePage