import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const menu1 = await prisma.category.upsert({
    where: { name: 'MENU 1' },
    update: {},
    create: { name: 'MENU 1', color: '#1a1a2e', position: 0 },
  })

  const accessories = await prisma.category.upsert({
    where: { name: 'ACCESSORIES' },
    update: {},
    create: { name: 'ACCESSORIES', color: '#16213e', position: 1 },
  })

  const menu1Products = [
    { name: '2.5 Ml Sandalwood Oil', price: 50, color: '#2e7d32', pluCode: 'P001' },
    { name: 'Sandalwood Oil 5 Ml', price: 90, color: '#2e7d32', pluCode: 'P002' },
    { name: '10 Ml Sandalwood Oil', price: 160, color: '#c2185b', pluCode: 'P003' },
    { name: '1.25 Ml Sandalwood Oil', price: 30, color: '#c2185b', pluCode: 'P004' },
    { name: '2.5 Ml Sandalwood Oil', price: 50, color: '#6a1b9a', pluCode: 'P005' },
    { name: 'Sandalwood Oil Loose', price: 40, color: '#6a1b9a', pluCode: 'P006' },
    { name: '2.5 Ml Attar 1460', price: 60, color: '#2e7d32', pluCode: 'P007' },
    { name: '5 Ml Attar 1460', price: 110, color: '#2e7d32', pluCode: 'P008' },
    { name: '10 Ml Attar 1460', price: 200, color: '#c2185b', pluCode: 'P009' },
    { name: '1.25 Ml Attar 1460', price: 30, color: '#c2185b', pluCode: 'P010' },
    { name: '1.25 Ml Attar 1140', price: 25, color: '#6a1b9a', pluCode: 'P011' },
    { name: 'Attar 1460 Loose', price: 45, color: '#6a1b9a', pluCode: 'P012' },
    { name: 'Ruh Khus 2.5 Ml', price: 70, color: '#2e7d32', pluCode: 'P013' },
    { name: '5 Ml Ruh Khus 1460', price: 130, color: '#2e7d32', pluCode: 'P014' },
    { name: '10 Ml Ruh Khus 1460', price: 240, color: '#c2185b', pluCode: 'P015' },
    { name: '1.25 Ml Ruh Khus 1460', price: 35, color: '#c2185b', pluCode: 'P016' },
    { name: '5 Ml Attar 1140', price: 100, color: '#6a1b9a', pluCode: 'P017' },
    { name: 'Ruh Khus 1460 Loose', price: 55, color: '#6a1b9a', pluCode: 'P018' },
    { name: '2.5 Ml Ruh Motia', price: 65, color: '#2e7d32', pluCode: 'P019' },
    { name: 'Ruh Motia 5 Ml', price: 120, color: '#2e7d32', pluCode: 'P020' },
    { name: '10 Ml Ruh Motia', price: 220, color: '#c2185b', pluCode: 'P021' },
    { name: '1.25 Ml Ruh Motia', price: 32, color: '#c2185b', pluCode: 'P022' },
    { name: '10 Ml Attar 840', price: 180, color: '#6a1b9a', pluCode: 'P023' },
    { name: 'Ruh Motia Loose', price: 50, color: '#6a1b9a', pluCode: 'P024' },
    { name: '2.5 Ml Ruh Chameli', price: 75, color: '#2e7d32', pluCode: 'P025' },
    { name: 'Ruh Chameli 5 Ml', price: 140, color: '#2e7d32', pluCode: 'P026' },
    { name: '10 Ml Ruh Chameli', price: 260, color: '#c2185b', pluCode: 'P027' },
    { name: '1.25 Ml Ruh Chameli', price: 38, color: '#c2185b', pluCode: 'P028' },
    { name: '5 Ml Attar 840', price: 95, color: '#6a1b9a', pluCode: 'P029' },
    { name: 'Ruh Chameli Loose', price: 60, color: '#6a1b9a', pluCode: 'P030' },
    { name: '2.5 Ml Attar 1040', price: 55, color: '#2e7d32', pluCode: 'P031' },
    { name: '5 Ml Attar 1040', price: 100, color: '#2e7d32', pluCode: 'P032' },
    { name: '10 Ml Attar 1040', price: 185, color: '#c2185b', pluCode: 'P033' },
    { name: '1.25 Ml Attar 1040', price: 28, color: '#c2185b', pluCode: 'P034' },
    { name: '10 Ml Attar 1140', price: 190, color: '#6a1b9a', pluCode: 'P035' },
    { name: 'Attar 1040 Loose', price: 42, color: '#6a1b9a', pluCode: 'P036' },
    { name: '2.5 Ml Attar 525', price: 45, color: '#2e7d32', pluCode: 'P037' },
    { name: '1.25 Ml Attar 525', price: 22, color: '#c2185b', pluCode: 'P038' },
    { name: '2.5 Ml Attar 840', price: 52, color: '#6a1b9a', pluCode: 'P039' },
    { name: 'Attar 525 Loose', price: 38, color: '#6a1b9a', pluCode: 'P040' },
    { name: '2.5 Ml Ruh Rajnigandha', price: 68, color: '#2e7d32', pluCode: 'P041' },
    { name: 'Ruh Rajnigandha 5 Ml', price: 125, color: '#2e7d32', pluCode: 'P042' },
    { name: '10 Ml Ruh Rajnigandha', price: 230, color: '#c2185b', pluCode: 'P043' },
    { name: '1.25 Ml Ruh Rajnigandha', price: 33, color: '#c2185b', pluCode: 'P044' },
    { name: '1.25 Ml Attar 840', price: 26, color: '#6a1b9a', pluCode: 'P045' },
    { name: 'Attar 1140 Loose', price: 48, color: '#6a1b9a', pluCode: 'P046' },
    { name: '2.5 Ml Ruh Gulab', price: 80, color: '#2e7d32', pluCode: 'P047' },
    { name: 'Ruh Gulab 5 Ml', price: 150, color: '#2e7d32', pluCode: 'P048' },
    { name: '10 Ml Ruh Gulab', price: 280, color: '#c2185b', pluCode: 'P049' },
    { name: '1.25 Ml Ruh Gulab', price: 40, color: '#c2185b', pluCode: 'P050' },
    { name: 'Attar 840 Loose', price: 44, color: '#6a1b9a', pluCode: 'P051' },
    { name: 'Ruh Rajnigandha Loose', price: 56, color: '#6a1b9a', pluCode: 'P052' },
    { name: 'GENERAL', price: 0, color: '#f57f17', pluCode: 'P053' },
  ]

  for (const p of menu1Products) {
    await prisma.product.upsert({
      where: { pluCode: p.pluCode },
      update: {},
      create: { ...p, categoryId: menu1.id, stock: 100 },
    })
  }

  const accessoryProducts = [
    { name: 'AGARBATTI-1', price: 35, color: '#e65100', pluCode: 'A001' },
    { name: 'OILS 35', price: 35, color: '#455a64', pluCode: 'A002' },
    { name: 'DHOOP & GIFT', price: 50, color: '#e65100', pluCode: 'A003' },
    { name: 'OILS 45', price: 45, color: '#455a64', pluCode: 'A004' },
    { name: 'ROSE AND KEWRA-WAT', price: 60, color: '#b71c1c', pluCode: 'A005' },
    { name: 'OILS 60', price: 60, color: '#455a64', pluCode: 'A006' },
    { name: 'SPRAY AND RF', price: 80, color: '#b71c1c', pluCode: 'A007' },
    { name: 'OILS 80', price: 80, color: '#455a64', pluCode: 'A008' },
    { name: 'COSMETICS', price: 100, color: '#1565c0', pluCode: 'A009' },
    { name: 'OILS 100-120', price: 110, color: '#455a64', pluCode: 'A010' },
    { name: 'AGARBATTI-2', price: 140, color: '#e65100', pluCode: 'A011' },
    { name: 'OILS 140-160', price: 150, color: '#455a64', pluCode: 'A012' },
    { name: 'OIL SET', price: 200, color: '#e65100', pluCode: 'A013' },
    { name: 'OILS 200', price: 200, color: '#455a64', pluCode: 'A014' },
    { name: 'ATTAR AND RUHS', price: 300, color: '#880e4f', pluCode: 'A015' },
    { name: 'OILS 300-320', price: 310, color: '#455a64', pluCode: 'A016' },
    { name: 'OILS 600-1000', price: 800, color: '#455a64', pluCode: 'A017' },
    { name: 'OILS 400-500', price: 450, color: '#455a64', pluCode: 'A018' },
  ]

  for (const p of accessoryProducts) {
    await prisma.product.upsert({
      where: { pluCode: p.pluCode },
      update: {},
      create: { ...p, categoryId: accessories.id, stock: 100 },
    })
  }

  console.log('✅ Seeding complete.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
