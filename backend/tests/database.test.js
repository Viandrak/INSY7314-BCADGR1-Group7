const mongoose = require('mongoose');
const { connectDB } = require('../src/config/database');

describe('connectDB', () => {
  const originalUri = process.env.MONGODB_URI;
  let connectSpy;

  beforeEach(() => {
    process.env.MONGODB_URI = 'mongodb://mongo:27017/hustlehub';
    connectSpy = jest.spyOn(mongoose, 'connect');
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.MONGODB_URI = originalUri;
    jest.restoreAllMocks();
  });

  test('connects on the first try without retrying', async () => {
    connectSpy.mockResolvedValue(mongoose);
    await connectDB({ baseDelayMs: 1 });

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  test('retries when MongoDB is slow to start and then connects', async () => {
    connectSpy
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue(mongoose);

    await expect(connectDB({ retries: 3, baseDelayMs: 1 })).resolves.toBeUndefined();
    expect(connectSpy).toHaveBeenCalledTimes(3);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  test('waits longer after each failed attempt (exponential backoff)', async () => {
    connectSpy
      .mockRejectedValueOnce(new Error('down'))
      .mockRejectedValueOnce(new Error('down'))
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue(mongoose);

    await connectDB({ retries: 3, baseDelayMs: 1 });

    const messages = console.warn.mock.calls.map((call) => call[0]);
    expect(messages[0]).toMatch(/Retrying in 1 ms/);
    expect(messages[1]).toMatch(/Retrying in 2 ms/);
    expect(messages[2]).toMatch(/Retrying in 4 ms/);
  });

  test('throws once the retries are used up so the server never starts without a database', async () => {
    connectSpy.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(connectDB({ retries: 2, baseDelayMs: 1 })).rejects.toThrow('ECONNREFUSED');
    // 1 first try + 2 retries
    expect(connectSpy).toHaveBeenCalledTimes(3);
  });

  test('throws straight away when MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI;

    await expect(connectDB({ baseDelayMs: 1 })).rejects.toThrow(/MONGODB_URI is not set/);
    expect(connectSpy).not.toHaveBeenCalled();
  });
});