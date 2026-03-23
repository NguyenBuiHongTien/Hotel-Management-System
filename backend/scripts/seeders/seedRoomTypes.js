const RoomType = require('../../models/roomTypeModel');

module.exports = async function seedRoomTypes() {
    console.log('📝 Seeding Room Types...');
    await RoomType.deleteMany({});
    
    const roomTypes = [
      {
        typeName: 'Single',
        description: 'Phòng đơn với 1 giường đơn',
        basePrice: 500000,
        capacity: 1,
        amenities: ['wifi', 'tv', 'ac', 'minibar']
      },
      {
        typeName: 'Double',
        description: 'Phòng đôi với 1 giường đôi',
        basePrice: 800000,
        capacity: 2,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'bathtub']
      },
      {
        typeName: 'Twin',
        description: 'Phòng đôi với 2 giường đơn',
        basePrice: 850000,
        capacity: 2,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'bathtub']
      },
      {
        typeName: 'Suite',
        description: 'Phòng suite sang trọng',
        basePrice: 1500000,
        capacity: 4,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'bathtub', 'balcony', 'jacuzzi']
      },
      {
        typeName: 'Deluxe',
        description: 'Phòng deluxe cao cấp',
        basePrice: 1200000,
        capacity: 3,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'bathtub', 'balcony']
      }
    ];

    const createdRoomTypes = await RoomType.insertMany(roomTypes);
    console.log('✅ Room Types seeded successfully!');
    console.log(`\n📊 Created ${createdRoomTypes.length} room types:\n`);
    roomTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type.typeName} - ${type.basePrice.toLocaleString('vi-VN')} VNĐ/đêm`);
    });
    console.log('\n');
};

