import React, { useState } from 'react';

export default function FarmerDashboard() {
  const [formData, setFormData] = useState({
    commodity: 'Tomato',
    quantity: '',
    district: 'Madurai',
    longitude: '',
    latitude: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Lot Submitted:', formData);
    alert('Lot created successfully!');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Produce Lot</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commodity</label>
          <input
            type="text"
            name="commodity"
            value={formData.commodity}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
            placeholder="e.g., Tomato"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Quintals)</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
            placeholder="e.g., 50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
          <input
            type="text"
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
            placeholder="e.g., Madurai"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="text"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
              placeholder="78.1198"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="text"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
              placeholder="9.9252"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 rounded-lg transition duration-200 mt-2"
        >
          Create Lot
        </button>
      </form>
    </div>
  );
}