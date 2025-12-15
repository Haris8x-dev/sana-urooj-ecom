// app/product/[id]/page.tsx
import ProductPage from "@/components/pages/product/ProductPage";

// Define the type for the dynamic route segment
interface ProductPageProps {
  params: {
    id: string; // Dynamic route segment: [id]
  };
}

export  default async function DynamicProductRoute({ params }: ProductPageProps) {
  const { id } = await params;
  
  // Render the client component and pass the ID
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 py-24 px-4 md:px-8">
      <ProductPage productId={id} />
    </div>
  );
}