import Link from 'next/link';

// Dummy data for navigation links
const navigation = {
    shop: [
        { name: 'New Arrivals', href: '/shop/new' },
        { name: 'Ready to Wear', href: '/shop/pret' },
        { name: 'Formals & Wedding', href: '/shop/formals' },
        { name: 'Sale', href: '/shop/sale' },
    ],
    company: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Blog', href: '/blog' },
        { name: 'Store Locator', href: '/stores' },
    ],
    customerService: [
        { name: 'FAQs', href: '/help/faqs' },
        { name: 'Shipping & Returns', href: '/help/shipping' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'Size Guide', href: '/help/size-guide' },
    ],
};

const Footer: React.FC = () => {
    // Current year for copyright
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#fcfbf4] border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                
                {/* 1. Main Footer Grid: Navigation & Newsletter */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-y-10 gap-x-8">
                    
                    {/* Newsletter / Brand Contact (Col 1 & 2 on mobile, Col 1 on desktop) */}
                    <div className="col-span-2 md:col-span-2 space-y-8">
                        {/* Brand Logo/Title - Replace with your actual logo component if available */}
                        <div className="text-xl font-serif tracking-widest uppercase text-gray-900">
                            JEEM
                        </div>
                        
                        {/* Newsletter Signup */}
                        <div className="max-w-xs">
                            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-800 mb-4">
                                Sign up for our newsletter
                            </h3>
                            <form className="mt-4 flex flex-col sm:flex-row">
                                <input
                                    id="email-address"
                                    name="email-address"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-2 mb-3 sm:mb-0 sm:mr-2 text-sm text-gray-700 bg-transparent border border-gray-400 focus:border-gray-900 focus:outline-none placeholder:text-gray-500 transition duration-300"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm font-medium uppercase tracking-widest text-white bg-gray-900 hover:bg-black transition duration-300"
                                >
                                    Subscribe
                                </button>
                            </form>
                        </div>
                        
                        {/* Contact Information (Below Newsletter) */}
                        <div className="space-y-1 pt-4 text-sm text-gray-600">
                            <p>Email: <a href="mailto:info@yourbrand.com" className="hover:text-gray-900 transition">info@yourbrand.com</a></p>
                            <p>Call: <a href="tel:+923001234567" className="hover:text-gray-900 transition">+92 300 1234567</a></p>
                            <p>Address: Lahore, Pakistan</p>
                        </div>
                    </div>

                    {/* Navigation Columns (Col 3, 4, 5 on desktop) */}
                    <div className="grid grid-cols-2 gap-8 col-span-2 md:col-span-3">
                        
                        {/* Shop Links */}
                        <div className="col-span-1">
                            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-800">
                                Shop
                            </h3>
                            <ul role="list" className="mt-4 space-y-3">
                                {navigation.shop.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-gray-600 hover:text-gray-900 transition duration-300">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company Links */}
                        <div className="col-span-1">
                            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-800">
                                Company
                            </h3>
                            <ul role="list" className="mt-4 space-y-3">
                                {navigation.company.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-gray-600 hover:text-gray-900 transition duration-300">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Customer Service Links */}
                        <div className="col-span-2 sm:col-span-1">
                            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-800">
                                Support
                            </h3>
                            <ul role="list" className="mt-4 space-y-3">
                                {navigation.customerService.map((item) => (
                                    <li key={item.name}>
                                        <Link href={item.href} className="text-sm text-gray-600 hover:text-gray-900 transition duration-300">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 2. Copyright and Legal Links (Bottom Section) */}
                <div className="mt-16 pt-8 border-t border-gray-300 flex flex-col md:flex-row md:justify-between md:items-center text-xs text-gray-600">
                    <p className="order-2 md:order-1 mt-4 md:mt-0">
                        &copy; {currentYear} JEEM. All rights reserved.
                    </p>
                    
                    {/* Legal Links (Terms, Privacy) */}
                    <div className="order-1 md:order-2 flex space-x-6">
                        <Link href="/legal/privacy" className="hover:text-gray-900 transition">
                            Privacy Policy
                        </Link>
                        <Link href="/legal/terms" className="hover:text-gray-900 transition">
                            Terms & Conditions
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;