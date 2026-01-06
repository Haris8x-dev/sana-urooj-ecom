// app/category/[id]/page.tsx
import CategoryPage from "@/components/pages/category/CategoryPage";

// Define the type for the dynamic route segment
interface CategoryPageProps {
  params: {
    id: string; // Dynamic route segment: [id]
  };
}

export default async function DynamicCategoryRoute({ params }: CategoryPageProps) {
  
  // FIX: Match the product page's successful pattern by explicitly awaiting params 
  // to resolve the Promise-wrapped object before destructuring the 'id'.
  const { id } = await params; 
  
  // Render the client component and pass the ID
  // Using the exact wrapper styling as your product page
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 py-24 px-4 md:px-8">
      <CategoryPage categoryId={id} />
    </div>
  );
}