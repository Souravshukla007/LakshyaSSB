
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Successfully imported PrismaClient')
        await prisma.$disconnect()
    } catch (e) {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    }
}

main()
