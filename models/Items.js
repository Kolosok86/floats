import mongoose from 'mongoose'
const { Schema, model } = mongoose
import ms from 'ms'

const stickerSchema = new Schema({
  _id: false,

  slot: Number,
  wear: Number,
  scale: Number,
  rotation: Number,
  tint_id: Number,
  offset_x: Number,
  offset_y: Number,
  sticker_id: Number,
})

const itemsSchema = new Schema(
  {
    stickers: [stickerSchema],
    defindex: Number,
    paintindex: Number,
    rarity: Number,
    quality: Number,
    paintwear: Number,
    paintseed: Number,
    killeaterscoretype: Number,
    killeatervalue: Number,
    customname: String,
    origin: Number,
    questid: Number,
    dropreason: Number,
    musicindex: Number,
    entindex: Number,

    s: String,
    a: String,
    d: String,
    m: String,
  },
  {
    versionKey: false,
    timestamps: true,
  }
)

itemsSchema.index({ updatedAt: 1 }, { expireAfterSeconds: ms('7d') })
itemsSchema.index({ a: 1 }, { unique: true })

export default model('items', itemsSchema)
