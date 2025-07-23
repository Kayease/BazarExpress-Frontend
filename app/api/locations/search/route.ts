import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return NextResponse.json({ 
      locations: [], 
      message: "Query too short" 
    });
  }

  try {
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!API_KEY) {
      throw new Error("Google Maps API key is missing");
    }

    // Use Google Maps Places API to search for locations
    // We're using findplacefromtext API instead of the autocomplete API
    // This gives us location results without the UI suggestions
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Google Places API");
    }

    const data = await response.json();
    
    if (data.status !== "OK") {
      // If we got no results, return an empty array instead of error
      if (data.status === "ZERO_RESULTS") {
        return NextResponse.json({ 
          locations: [],
          status: "success",
          count: 0
        });
      }
      throw new Error(`Google API error: ${data.status}`);
    }

    // Format results to match our Location interface
    const locations = data.results.map((place: any, index: number) => {
      // Extract the first part of the name or address as the location name
      const nameParts = place.name.split(',');
      const name = nameParts[0].trim();

      return {
        id: place.place_id || `place-${index}-${Date.now()}`,
        name: name,
        address: place.formatted_address,
        deliveryTime: "8 minutes", // Default delivery time
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        }
      };
    }).slice(0, 10); // Limit to 10 results for better performance

    return NextResponse.json({ 
      locations,
      status: "success",
      count: locations.length
    });
  } catch (error: any) {
    console.error("Location search error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to search locations", 
        locations: [],
        status: "error"
      },
      { status: 500 }
    );
  }
} 