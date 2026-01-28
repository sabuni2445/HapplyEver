import { describe, it, expect, vi } from 'vitest'
import { getAllServices, getWeddingById, createWedding } from '../api'

// Mock fetch
global.fetch = vi.fn()

describe('API Utils', () => {
    beforeEach(() => {
        fetch.mockClear()
    })

    describe('getAllServices', () => {
        it('should fetch all services successfully', async () => {
            const mockServices = [
                { id: 1, name: 'Wedding Photography', price: 50000 },
                { id: 2, name: 'Catering Service', price: 100000 }
            ]

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockServices
            })

            const result = await getAllServices()

            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/services'))
            expect(result).toEqual(mockServices)
        })

        it('should handle API errors gracefully', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'))

            await expect(getAllServices()).rejects.toThrow()
        })
    })

    describe('getWeddingById', () => {
        it('should fetch wedding by ID successfully', async () => {
            const mockWedding = {
                id: 1,
                partnersName: 'John & Jane',
                weddingDate: '2026-06-15'
            }

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockWedding
            })

            const result = await getWeddingById(1)

            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/weddings/1'))
            expect(result.partnersName).toBe('John & Jane')
        })
    })

    describe('createWedding', () => {
        it('should create a new wedding successfully', async () => {
            const newWedding = {
                partnersName: 'Alice & Bob',
                weddingDate: '2026-07-20',
                clerkId: 'user_123'
            }

            const createdWedding = { ...newWedding, id: 1 }

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => createdWedding
            })

            const result = await createWedding(newWedding)

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/weddings'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify(newWedding)
                })
            )
            expect(result.id).toBe(1)
            expect(result.partnersName).toBe('Alice & Bob')
        })
    })
})
