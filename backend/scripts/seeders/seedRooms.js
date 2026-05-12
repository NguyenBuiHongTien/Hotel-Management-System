const Room = require('../../models/roomModel');
const RoomType = require('../../models/roomTypeModel');

module.exports = async function seedRooms() {
    // Ensure room types exist
    const roomTypes = await RoomType.find();
    if (roomTypes.length === 0) {
      throw new Error('No room types found. Run seed:room-types first.');
    }

    console.log('📝 Seeding Rooms...');
    await Room.deleteMany({});
    
    // Resolve room type documents
    const singleType = await RoomType.findOne({ typeName: 'Single' });
    const doubleType = await RoomType.findOne({ typeName: 'Double' });
    const twinType = await RoomType.findOne({ typeName: 'Twin' });
    const suiteType = await RoomType.findOne({ typeName: 'Suite' });
    const deluxeType = await RoomType.findOne({ typeName: 'Deluxe' });

    const rooms = [];
    
    // Single rooms (101-110)
    if (singleType) {
      for (let i = 101; i <= 110; i++) {
        rooms.push({
          roomNumber: i.toString(),
          floor: '1',
          status: 'available',
          roomType: singleType._id
        });
      }
    }

    // Double rooms (201-210)
    if (doubleType) {
      for (let i = 201; i <= 210; i++) {
        rooms.push({
          roomNumber: i.toString(),
          floor: '2',
          status: 'available',
          roomType: doubleType._id
        });
      }
    }

    // Twin rooms (301-305)
    if (twinType) {
      for (let i = 301; i <= 305; i++) {
        rooms.push({
          roomNumber: i.toString(),
          floor: '3',
          status: 'available',
          roomType: twinType._id
        });
      }
    }

    // Suite rooms (401-403)
    if (suiteType) {
      for (let i = 401; i <= 403; i++) {
        rooms.push({
          roomNumber: i.toString(),
          floor: '4',
          status: 'available',
          roomType: suiteType._id
        });
      }
    }

    // Deluxe rooms (501-505)
    if (deluxeType) {
      for (let i = 501; i <= 505; i++) {
        rooms.push({
          roomNumber: i.toString(),
          floor: '5',
          status: 'available',
          roomType: deluxeType._id
        });
      }
    }

    await Room.insertMany(rooms);
    console.log('✅ Rooms seeded successfully!');
    console.log(`\n📊 Created ${rooms.length} rooms\n`);
};

