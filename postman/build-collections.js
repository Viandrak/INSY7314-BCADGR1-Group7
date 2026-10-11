// Builds the three HustleHub+ Part 2 Postman collections.

const fs = require('fs');
const path = require('path');

const SCHEMA = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';


function q(name, method, url, o = {}) {
  const status = (c) => `pm.test('Status is ${c}', () => pm.response.to.have.status(${c}));`;
  const hasBody = o.b !== undefined || o.raw !== undefined;
  const header = [];
  if (hasBody) header.push({ key: 'Content-Type', value: 'application/json' });
  if (o.t) header.push({ key: 'Authorization', value: `Bearer {{${o.t}}}` });
  (o.h || []).forEach((h) => header.push(h));
  const event = [];
  if (o.pre) event.push({ listen: 'prerequest', script: { exec: o.pre } });
  const tests = o.tests || (o.c ? [status(o.c), ...(o.x || [])] : null);
  if (tests) event.push({ listen: 'test', script: { exec: tests } });
  const item = { name };
  if (event.length) item.event = event;
  item.request = { method, header, url: '{{baseUrl}}' + url };
  if (hasBody) item.request.body = { mode: 'raw', raw: o.raw !== undefined ? o.raw : JSON.stringify(o.b) };
  return item;
}

function save(file, name, description, item, variable) {
  const data = { info: { name, schema: SCHEMA, description }, item, variable };
  fs.writeFileSync(path.join(__dirname, file), JSON.stringify(data, null, 2));
  console.log('Wrote', file);
}

const vars = (obj) => Object.entries(obj).map(([key, value]) => ({ key, value }));

// ---------- 1. Main collection ----------
const main = [
  ['Auth', [
    q('Register - Success (unique email)','POST','/api/auth/register',{b:{email:'{{randomEmail}}',password:'StrongPass1',role:'freelancer'},pre:["pm.collectionVariables.set('randomEmail', `p2test+${Date.now()}@hustlehub.com`);"],c:201,x:["pm.test('success true', () => pm.expect(pm.response.json().success).to.eql(true));"]}),
    q('Register - Duplicate Email','POST','/api/auth/register',{b:{email:'{{randomEmail}}',password:'StrongPass1',role:'freelancer'},c:409}),
    q('Register - Missing Fields','POST','/api/auth/register',{b:{email:'missing@hustlehub.com'},c:400}),
    q('Register - Invalid Email Format','POST','/api/auth/register',{b:{email:'not-an-email',password:'StrongPass1',role:'client'},c:400}),
    q('Register - Weak Password','POST','/api/auth/register',{b:{email:'weak@hustlehub.com',password:'123',role:'client'},c:400}),
    q('Register - Invalid Role (admin blocked)','POST','/api/auth/register',{b:{email:'adminattempt@hustlehub.com',password:'StrongPass1',role:'admin'},c:400}),
    q('Register - Unexpected Field Rejected (allowlist)','POST','/api/auth/register',{b:{email:'extra@hustlehub.com',password:'StrongPass1',role:'client',isAdmin:true},c:400,x:["pm.test('mentions unexpected field', () => pm.expect(pm.response.json().message).to.include('Unexpected'));"]}),
    q('Register - NoSQL Injection Attempt (object email)','POST','/api/auth/register',{b:{email:{$gt:''},password:'StrongPass1',role:'client'},c:400}),
    q('Register - XSS Attempt in Email','POST','/api/auth/register',{b:{email:'<script>alert(1)</script>@hustlehub.com',password:'StrongPass1',role:'client'},c:400}),
    q('Login - Success (freelancer1, captures token)','POST','/api/auth/login',{b:{email:'freelancer1@hustlehub.com',password:'{{seedPassword}}'},c:200,x:["const json = pm.response.json();","pm.test('token returned', () => pm.expect(json.token).to.be.a('string'));","if (json.token) pm.collectionVariables.set('freelancerToken', json.token);","if (json.user && json.user.id) pm.collectionVariables.set('freelancerId', json.user.id);"]}),
    q('Login - Success (freelancer2, captures token)','POST','/api/auth/login',{b:{email:'freelancer2@hustlehub.com',password:'{{seedPassword}}'},c:200,x:["const json = pm.response.json();","if (json.token) pm.collectionVariables.set('freelancer2Token', json.token);"]}),
    q('Login - Success (client1, captures token)','POST','/api/auth/login',{b:{email:'client1@hustlehub.com',password:'{{seedPassword}}'},c:200,x:["const json = pm.response.json();","if (json.token) pm.collectionVariables.set('clientToken', json.token);"]}),
    q('Login - Success (admin, captures token)','POST','/api/auth/login',{b:{email:'admin@hustlehub.com',password:'{{seedPassword}}'},c:200,x:["const json = pm.response.json();","if (json.token) pm.collectionVariables.set('adminToken', json.token);"]}),
    q('Login - Success (client2, captures token - reserved for rate-limit test)','POST','/api/auth/login',{b:{email:'client2@hustlehub.com',password:'{{seedPassword}}'},c:200,x:["const json = pm.response.json();","if (json.token) pm.collectionVariables.set('client2Token', json.token);"]}),
    q('Login - Wrong Password','POST','/api/auth/login',{b:{email:'freelancer1@hustlehub.com',password:'WrongPassword1'},c:401}),
    q('Login - Nonexistent User','POST','/api/auth/login',{b:{email:'doesnotexist@hustlehub.com',password:'StrongPass1'},c:401}),
    q('Login - Missing Fields','POST','/api/auth/login',{b:{email:'freelancer1@hustlehub.com'},c:400}),
    q('Login - Unexpected Field Rejected','POST','/api/auth/login',{b:{email:'freelancer1@hustlehub.com',password:'{{seedPassword}}',role:'admin'},c:400}),
    q('Login - NoSQL Injection Attempt (object password)','POST','/api/auth/login',{b:{email:'freelancer1@hustlehub.com',password:{$ne:''}},c:400})
  ]],
  ['Gigs', [
    q('Create Gig - Success (freelancer1)','POST','/api/gigs',{b:{title:'Logo Design',description:'I will design a professional logo for your brand.',category:'Design',price:500,deliveryDays:3},t:'freelancerToken',c:201,x:["const json = pm.response.json();","if (json.gig && json.gig.id) pm.collectionVariables.set('gigId', json.gig.id);"]}),
    q('Create Gig - For Deletion Test (freelancer1)','POST','/api/gigs',{b:{title:'Temporary Gig',description:'This gig exists only to be deleted in a later test.',category:'Other',price:50,deliveryDays:1},t:'freelancerToken',c:201,x:["const json = pm.response.json();","if (json.gig && json.gig.id) pm.collectionVariables.set('gigToDeleteId', json.gig.id);"]}),
    q('Create Gig - As Client (RBAC 403)','POST','/api/gigs',{b:{title:'Should Fail',description:'A client should not be able to create a gig.',category:'Design',price:100,deliveryDays:2},t:'clientToken',c:403}),
    q('Create Gig - No Token (401)','POST','/api/gigs',{b:{title:'No Auth',description:'This request has no Authorization header at all.',category:'Design',price:100,deliveryDays:2},c:401}),
    q('Create Gig - Invalid Token (401)','POST','/api/gigs',{b:{title:'Bad Token',description:'This request uses a made-up, invalid JWT.',category:'Design',price:100,deliveryDays:2},h:[{key:'Authorization',value:'Bearer not-a-real-token'}],c:401}),
    q('Create Gig - Missing Fields (400)','POST','/api/gigs',{b:{title:'Incomplete'},t:'freelancerToken',c:400}),
    q('Create Gig - Invalid Category (400)','POST','/api/gigs',{b:{title:'Bad Category',description:'Category is not in the allowed enum list.',category:'NotARealCategory',price:100,deliveryDays:2},t:'freelancerToken',c:400}),
    q('Create Gig - Price Out of Range (400)','POST','/api/gigs',{b:{title:'Too Cheap',description:'Price below the allowed minimum of 1.',category:'Design',price:0,deliveryDays:2},t:'freelancerToken',c:400}),
    q('Create Gig - Unexpected Field Rejected (allowlist)','POST','/api/gigs',{b:{title:'Sneaky Gig',description:'Tries to set the freelancer field directly.',category:'Design',price:100,deliveryDays:2,freelancer:'000000000000000000000000'},t:'freelancerToken',c:400,x:["pm.test('mentions unexpected field', () => pm.expect(pm.response.json().message).to.include('Unexpected'));"]}),
    q('Create Gig - NoSQL Injection in Title (object value)','POST','/api/gigs',{b:{title:{$gt:''},description:'Title is an object instead of a string.',category:'Design',price:100,deliveryDays:2},t:'freelancerToken',c:400}),
    q('Create Gig - XSS Attempt in Description (sanitised, not stored raw)','POST','/api/gigs',{b:{title:'XSS Test Gig',description:'<script>alert(\'xss\')</script> this description contains a script tag.',category:'Design',price:100,deliveryDays:2},t:'freelancerToken',tests:["pm.test('Status is 201 (accepted but sanitised)', () => pm.response.to.have.status(201));","const json = pm.response.json();","pm.test('script tag not present in stored description', () => pm.expect(json.gig.description).to.not.include('<script>'));"]}),
    q('Get All Gigs - Success','GET','/api/gigs',{t:'clientToken',c:200,x:["pm.test('gigs array returned', () => pm.expect(pm.response.json().gigs).to.be.an('array'));"]}),
    q('Get All Gigs - Invalid Category Query Rejected','GET','/api/gigs?category=NotReal',{t:'clientToken',c:400}),
    q('Get My Gigs - Success (freelancer1)','GET','/api/gigs/mine',{t:'freelancerToken',c:200}),
    q('Get My Gigs - As Client (RBAC 403)','GET','/api/gigs/mine',{t:'clientToken',c:403}),
    q('Get Gig By ID - Invalid ID Format (400)','GET','/api/gigs/not-a-valid-id',{t:'clientToken',c:400}),
    q('Get Gig By ID - Not Found (404)','GET','/api/gigs/000000000000000000000000',{t:'clientToken',c:404}),
    q('Update Gig - Success (freelancer1, own gig)','PATCH','/api/gigs/{{gigId}}',{b:{price:600},t:'freelancerToken',c:200}),
    q('Update Gig - Not Owner (freelancer2 tries, 403)','PATCH','/api/gigs/{{gigId}}',{b:{price:1},t:'freelancer2Token',c:403}),
    q('Update Gig - Unexpected Field Rejected','PATCH','/api/gigs/{{gigId}}',{b:{freelancer:'000000000000000000000000'},t:'freelancerToken',c:400}),
    q('Update Gig - Invalid ID Format (400)','PATCH','/api/gigs/not-a-valid-id',{b:{price:100},t:'freelancerToken',c:400}),
    q('Delete Gig - Not Owner (freelancer2 tries, 403)','DELETE','/api/gigs/{{gigId}}',{t:'freelancer2Token',c:403}),
    q('Delete Gig - Success (freelancer1 deletes throwaway gig)','DELETE','/api/gigs/{{gigToDeleteId}}',{t:'freelancerToken',c:200})
  ]],
  ['Bookings', [
    q('Create Booking - Success (client1 books freelancer1\'s gig)','POST','/api/bookings',{b:{gigId:'{{gigId}}'},t:'clientToken',c:201,x:["const json = pm.response.json();","pm.test('transaction returned alongside booking', () => pm.expect(json.transaction).to.be.an('object'));","if (json.booking && json.booking.id) pm.collectionVariables.set('bookingId', json.booking.id);"]}),
    q('Create Booking - Freelancer Account Blocked (RBAC 403)','POST','/api/bookings',{b:{gigId:'{{gigId}}'},t:'freelancerToken',c:403}),
    q('Create Booking - As Freelancer Role (RBAC 403)','POST','/api/bookings',{b:{gigId:'{{gigId}}'},t:'freelancer2Token',c:403}),
    q('Create Booking - No Token (401)','POST','/api/bookings',{b:{gigId:'{{gigId}}'},c:401}),
    q('Create Booking - Invalid Gig ID Format (400)','POST','/api/bookings',{b:{gigId:'not-a-valid-id'},t:'clientToken',c:400}),
    q('Create Booking - Nonexistent Gig (404)','POST','/api/bookings',{b:{gigId:'000000000000000000000000'},t:'clientToken',c:404}),
    q('Create Booking - Missing gigId (400)','POST','/api/bookings',{b:{},t:'clientToken',c:400}),
    q('Create Booking - Unexpected Field Rejected (allowlist)','POST','/api/bookings',{b:{gigId:'{{gigId}}',amount:1},t:'clientToken',c:400}),
    q('Get My Bookings - Success (client1)','GET','/api/bookings/mine',{t:'clientToken',c:200,x:["pm.test('bookings array returned', () => pm.expect(pm.response.json().bookings).to.be.an('array'));"]}),
    q('Get My Bookings - As Freelancer (RBAC 403)','GET','/api/bookings/mine',{t:'freelancerToken',c:403}),
    q('Get Received Bookings - Success (freelancer1)','GET','/api/bookings/received',{t:'freelancerToken',c:200,x:["pm.test('bookings array returned', () => pm.expect(pm.response.json().bookings).to.be.an('array'));"]}),
    q('Get Received Bookings - As Client (RBAC 403)','GET','/api/bookings/received',{t:'clientToken',c:403})
  ]],
  ['Income', [
    q('Get Income Summary - Success (freelancer1)','GET','/api/income/summary',{t:'freelancerToken',c:200,x:["const json = pm.response.json();","pm.test('totalIncome is a number', () => pm.expect(json.income.totalIncome).to.be.a('number'));","pm.test('estimatedTax is a number', () => pm.expect(json.income.estimatedTax).to.be.a('number'));","pm.test('estimatedTaxRate is present', () => pm.expect(json.income.estimatedTaxRate).to.be.a('number'));"]}),
    q('Get Income Summary - As Client (RBAC 403)','GET','/api/income/summary',{t:'clientToken',c:403}),
    q('Get Income Summary - No Token (401)','GET','/api/income/summary',{c:401}),
    q('Get Income Summary - Invalid Token (401)','GET','/api/income/summary',{h:[{key:'Authorization',value:'Bearer not-a-real-token'}],c:401})
  ]],
  ['RBAC & Admin', [
    q('Admin - Get All Users - Success','GET','/api/admin/users',{t:'adminToken',c:200}),
    q('Admin - Get All Users - As Freelancer (RBAC 403)','GET','/api/admin/users',{t:'freelancerToken',c:403}),
    q('Admin - Get All Users - As Client (RBAC 403)','GET','/api/admin/users',{t:'clientToken',c:403}),
    q('Admin - Get All Users - No Token (401)','GET','/api/admin/users',{c:401}),
    q('Admin - Get All Gigs - Success','GET','/api/admin/gigs',{t:'adminToken',c:200}),
    q('Admin - Get All Gigs - As Freelancer (RBAC 403)','GET','/api/admin/gigs',{t:'freelancerToken',c:403}),
    q('Admin - Get All Bookings - Success','GET','/api/admin/bookings',{t:'adminToken',c:200}),
    q('Admin - Get All Bookings - As Client (RBAC 403)','GET','/api/admin/bookings',{t:'clientToken',c:403}),
    q('Protected Route - Valid Token','GET','/api/protected/test',{t:'freelancerToken',c:200}),
    q('Protected Route - No Token','GET','/api/protected/test',{c:401}),
    q('Protected Route - Invalid Token','GET','/api/protected/test',{h:[{key:'Authorization',value:'Bearer not-a-real-token'}],c:401})
  ]],
  ['Security Headers', [
    q('Security Headers - Present on Public Route (health check)','GET','/',{c:200,x:["pm.test('Has Content-Security-Policy header', () => pm.expect(pm.response.headers.has('Content-Security-Policy')).to.be.true);","pm.test('Has X-Content-Type-Options header', () => pm.expect(pm.response.headers.has('X-Content-Type-Options')).to.be.true);","pm.test('X-Content-Type-Options is nosniff', () => pm.expect(pm.response.headers.get('X-Content-Type-Options')).to.eql('nosniff'));","pm.test('Does not expose X-Powered-By', () => pm.expect(pm.response.headers.has('X-Powered-By')).to.be.false);"]}),
    q('Security Headers - Present on Protected Route (gigs)','GET','/api/gigs',{t:'clientToken',c:200,x:["pm.test('Has Content-Security-Policy header', () => pm.expect(pm.response.headers.has('Content-Security-Policy')).to.be.true);","pm.test('CSP default-src is self', () => pm.expect(pm.response.headers.get('Content-Security-Policy')).to.include(\"default-src 'self'\"));","pm.test('Has X-Frame-Options or frame-ancestors directive', () => { const csp = pm.response.headers.get('Content-Security-Policy'); const xfo = pm.response.headers.has('X-Frame-Options'); pm.expect(xfo || (csp && csp.includes('frame-ancestors'))).to.be.true; });"]}),
    q('Security Headers - CORS Origin Restricted','OPTIONS','/api/gigs',{h:[{key:'Origin',value:'http://localhost:5173'},{key:'Access-Control-Request-Method',value:'GET'}],tests:["pm.test('Status is 200 or 204', () => pm.expect([200,204]).to.include(pm.response.code));","pm.test('Access-Control-Allow-Origin matches frontend', () => pm.expect(pm.response.headers.get('Access-Control-Allow-Origin')).to.eql('http://localhost:5173'));"]})
  ]]
];

save(
  'HustleHub-Part2.postman_collection.json',
  'HustleHub+ Part 2 - Full API',
  'Part 2 backend tests: Auth, Gigs, Bookings, Income, RBAC/Admin, Security Headers.',
  main.map(([name, item]) => ({ name, item })),
  vars({
    baseUrl: 'https://localhost:5000', seedPassword: '', randomEmail: '',
    freelancerToken: '', freelancer2Token: '', clientToken: '', client2Token: '', adminToken: '',
    freelancerId: '', gigId: '', gigToDeleteId: '', bookingId: '',
  })
);

// ---------- 2. Login rate limit (run alone, after a backend restart) ----------
const loginAttempts = [];
for (let i = 1; i <= 11; i++) {
  loginAttempts.push(q(`Attempt ${i} - Login with wrong password`, 'POST', '/api/auth/login', {
    b: { email: 'freelancer1@hustlehub.com', password: 'WrongPassword1' },
    tests: i <= 10
      ? [`pm.test('Attempt ${i} returns 401 (wrong password, not yet limited)', () => pm.response.to.have.status(401));`]
      : [
        "pm.test('11th attempt is rate limited (429)', () => pm.response.to.have.status(429));",
        "pm.test('Retry-After header present', () => pm.expect(pm.response.headers.has('Retry-After')).to.be.true);",
        'const json = pm.response.json();',
        "pm.test('Rate limit message returned', () => pm.expect(json.message).to.include('Too many'));",
      ],
  }));
}
save(
  'HustleHub-Part2-LoginRateLimit.postman_collection.json',
  'HustleHub+ Part 2 - Login Rate Limit (standalone)',
  'Standalone: tests the login/register rate limit. Restart the server before running this on its own.',
  loginAttempts,
  vars({ baseUrl: 'https://localhost:5000' })
);

// ---------- 3. Booking rate limit (run alone, after a backend restart) ----------
const bookingItems = [
  q('Setup 1 - Login as freelancer1 (capture token)', 'POST', '/api/auth/login', {
    b: { email: 'freelancer1@hustlehub.com', password: '{{seedPassword}}' }, c: 200,
    x: ['const json = pm.response.json();', "if (json.token) pm.collectionVariables.set('freelancerToken', json.token);"],
  }),
  q('Setup 2 - Create a gig to book against', 'POST', '/api/gigs', {
    b: { title: 'Rate Limit Test Gig', description: 'Used only to test the booking rate limiter.', category: 'Other', price: 50, deliveryDays: 1 },
    t: 'freelancerToken', c: 201,
    x: ['const json = pm.response.json();', "if (json.gig && json.gig.id) pm.collectionVariables.set('gigId', json.gig.id);"],
  }),
  q('Setup 3 - Login as client2 (fresh user, 0 prior bookings)', 'POST', '/api/auth/login', {
    b: { email: 'client2@hustlehub.com', password: '{{seedPassword}}' }, c: 200,
    x: ['const json = pm.response.json();', "if (json.token) pm.collectionVariables.set('client2Token', json.token);"],
  }),
];
for (let i = 1; i <= 6; i++) {
  bookingItems.push(q(`Attempt ${i} - Create booking as client2`, 'POST', '/api/bookings', {
    b: { gigId: '{{gigId}}' }, t: 'client2Token',
    tests: i <= 5
      ? [`pm.test('Booking attempt ${i} succeeds (201)', () => pm.response.to.have.status(201));`]
      : [
        "pm.test('6th booking attempt is rate limited (429)', () => pm.response.to.have.status(429));",
        "pm.test('Retry-After header present', () => pm.expect(pm.response.headers.has('Retry-After')).to.be.true);",
      ],
  }));
}
save(
  'HustleHub-Part2-BookingRateLimit.postman_collection.json',
  'HustleHub+ Part 2 - Booking Rate Limit (standalone)',
  'Standalone: tests the booking rate limit. Restart the server before running this on its own.',
  bookingItems,
  vars({ baseUrl: 'https://localhost:5000', seedPassword: '', freelancerToken: '', client2Token: '', gigId: '' })
);