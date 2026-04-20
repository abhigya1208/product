require('dotenv').config();
require('./config/db')().then(async () => {
    const Student = require('./models/Student');
    const User = require('./models/User');
    const studentsToDelete = await Student.find({ rollNumber: { $ne: '26010001' } });
    for (let s of studentsToDelete) {
        await Student.deleteOne({ _id: s._id });
        await User.deleteOne({ _id: s.userId });
    }
    console.log('Deleted ' + studentsToDelete.length + ' test students.');
    process.exit(0);
});
