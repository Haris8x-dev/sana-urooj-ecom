import ContactFooter from '@/components/pages/contact/ContactFooter'
import ContactForm from '@/components/pages/contact/ContactForm'
import ContactHero from '@/components/pages/contact/ContactHero'
import React from 'react'

const ContactPage = () => {
  return (
    <div>
        <ContactHero/>
        <ContactForm/>
        <ContactFooter/>
    </div>
  )
}

export default ContactPage;