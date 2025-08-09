// Google Maps TypeScript declarations
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteSessionToken: any;
          AutocompleteService: any;
          PlacesService: any;
          Autocomplete: any;
        };
        Geocoder: any;
        Map: any;
        Marker: any;
        ControlPosition: any;
      };
    };
  }
}

export {};