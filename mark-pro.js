const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const emailToFind = process.argv[2] || 'cadet@academy.in';

    const user = await prisma.user.updateMany({
        where: {
            OR: [
                { email: emailToFind },
                { fullName: { contains: 'Vikram Batra', mode: 'insensitive' } }
            ]
        },
        data: {
            plan: 'PRO',
            planExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
    });

    console.log('Updated users count:', user.count);

    if (user.count > 0) {
        const updatedUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailToFind },
                    { fullName: { contains: 'Vikram Batra', mode: 'insensitive' } }
                ]
            }
        });
        console.log('User upgraded to PRO:', updatedUser.email);
    } else {
        console.log('Could not find user with that name or email.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
