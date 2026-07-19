import fs from 'fs';

const t = fs.readFileSync('src/game/constants/skills.ts', 'utf8');
const blocks = t.split(/(?=^\s*id:\s*')/m).slice(1);
const skills = [];

for (const b of blocks) {
  const id = b.match(/id:\s*'([^']+)'/)?.[1];
  const name =
    b.match(/name:\s*'([^']+)'/)?.[1] ||
    b.match(/name:\s*"([^"]+)"/)?.[1];
  const dmg = b.match(/damageType:\s*DamageType\.(\w+)/)?.[1];
  const el = b.match(/element:\s*ElementType\.(\w+)/)?.[1];
  const action = b.match(/actionType:\s*ActionType\.(\w+)/)?.[1];
  const image = b.match(/image:\s*'([^']+)'/)?.[1];
  const icon = b.match(/icon:\s*'([^']+)'/)?.[1];
  if (id) skills.push({ id, name, dmg, el, action, image, icon });
}

fs.mkdirSync('todos', { recursive: true });
fs.writeFileSync('todos/skills-meta.json', JSON.stringify(skills, null, 2));
console.log('COUNT', skills.length);
console.log('with image', skills.filter((s) => s.image).length);
console.log('with icon', skills.filter((s) => s.icon).length);
