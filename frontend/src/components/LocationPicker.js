import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

function LocationMarker({ position, setPosition, setFormData }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString()
      }));
    }
  });

  return position ? <Marker position={position} /> : null;
}

function LocationPicker({ formData, setFormData }) {
  const position =
    formData.latitude && formData.longitude
      ? [parseFloat(formData.latitude), parseFloat(formData.longitude)]
      : null;

  return (
    <MapContainer
      center={position || [-36.8485, 174.7633]}
      zoom={13}
      style={{ height: '300px', width: '100%', marginTop: '10px' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker
        position={position}
        setPosition={() => {}}
        setFormData={setFormData}
      />
    </MapContainer>
  );
}

export default LocationPicker;