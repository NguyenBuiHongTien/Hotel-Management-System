const RoomType = require('../../models/roomTypeModel');

module.exports = async function seedRoomTypes() {
    console.log('📝 Seeding Room Types...');
    await RoomType.deleteMany({});
    
    const roomTypes = [
      {
        typeName: 'Single',
        description: 'Single room with one single bed',
        basePrice: 500000,
        capacity: 1,
        amenities: ['wifi', 'tv', 'ac', 'minibar']
      },
      {
        typeName: 'Double',
        description: 'Double room with one double bed',
        basePrice: 800000,
        capacity: 2,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'bathtub']
      },
      {
        typeName: 'Twin',
        description: 'Twin room with two single beds',
        basePrice: 850000,
        capacity: 2,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'bathtub']
      },
      {
        typeName: 'Suite',
        description: 'Luxury suite',
        basePrice: 1500000,
        capacity: 4,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'bathtub', 'balcony', 'jacuzzi']
      },
      {
        typeName: 'Deluxe',
        description: 'Premium deluxe room',
        basePrice: 1200000,
        capacity: 3,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'bathtub', 'balcony']
      }
    ];

    const createdRoomTypes = await RoomType.insertMany(roomTypes);
    console.log('✅ Room Types seeded successfully!');
    console.log(`\n📊 Created ${createdRoomTypes.length} room types:\n`);
    roomTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type.typeName} - ${type.basePrice.toLocaleString('en-US')} VND/night`);
    });
    console.log('\n');
};

