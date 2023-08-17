const Book = require('../models/Book');
const httpStatus = require('http-status');
const fs = require('fs');

exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id
    delete bookObject._userId
    const totalRating = bookObject.ratings.reduce((accumulator, currentObject) => accumulator + currentObject.grade, 0);
    const averageRating = totalRating / bookObject.ratings.length;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        title: bookObject.title,
        author: bookObject.author,
        year: bookObject.year,
        averageRating
    });
    await book.save();
    return res.status(httpStatus.CREATED).json({ message: 'Objet enregistré !' });
  }
  catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

exports.modifyBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id })
    if (!book) { return res.status(httpStatus.NOT_FOUND).json({ message: 'non trouver' }); }
    if (book.userId != req.auth.userId) { return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Not authorized' }); }

    const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      } : { ...req.body };
    delete bookObject._id
    delete bookObject.userId

    if (req.file) {
      const filename = book.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, async (unlinkError) => {
        try {
          if (unlinkError) {
            throw unlinkError;
          }
          await Book.updateOne({ _id: req.params.id }, { ...bookObject });
          return res.status(httpStatus.OK).json({ message: 'image modifié!' });
        } catch (error) {
          res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
      });
    }
    else {
      try {
        await Book.updateOne({ _id: req.params.id }, { ...bookObject})
        return res.status(httpStatus.OK).json({ message: 'Objet modifié!' })
      }
      catch (error) {
        res.status(httpStatus.UNAUTHORIZED).json({ error })
      }
    }
  }
 catch (error) {
    return res.status(httpStatus.BAD_REQUEST).json({ error })
 }
}

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id})
    if (book.userId !== req.auth.userId) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Livre non trouvé ou non autorisé" });
    }
    const filename = book.imageUrl.split('/images/')[1];
    fs.unlink(`images/${filename}`, async () => {
      try {
        await Book.deleteOne({_id: req.params.id})
        return res.status(httpStatus.OK).json({message: 'Objet supprimé !'}) 
      } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: deleteError.message })
      }   
    });
  }
  catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error })
  }
}

exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find()
    return res.status(httpStatus.OK).json(books)
  }
  catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error });
  }
}

exports.getOneBook = async (req, res, next) => {
  try {
    const oneBook = await Book.findOne({ _id: req.params.id })
    return res.status(httpStatus.OK).json(oneBook)
  } catch (error) {
    res.status(httpStatus.NOT_FOUND).json({ error });
  }
};

exports.getBestRating = async (req, res, next) => {
    try {
        const books = await Book.find({})
            .sort({ averageRating: -1 })
            .limit(3);
        res.status(httpStatus.OK).json(books);
    } catch (error) {
        res.status(httpStatus.NOT_FOUND).json({ error: error.message });
    }
};

exports.createRating = async (req, res, next) => {
  try {
    const bookId = req.params.id; // Supposons que l'identifiant du livre est passé en tant que paramètre dans l'URL
    const rating = {
      grade: req.body.rating,
      userId: req.body.userId,
    }
    const book = await Book.findOne({ _id: bookId })
    if (!book) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'Livre non trouvé' });
    }
    const existingRating = book.ratings.find(rating => rating.userId === req.auth.userId);
    if (existingRating) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'L\'utilisateur a déjà noté ce livre' });
    }
    book.ratings.push(rating)
    const totalRating = book.ratings.reduce((accumulator, currentObject) => accumulator + currentObject.grade, 0);
    const averageRating = totalRating / book.ratings.length
    book.averageRating = Math.floor(averageRating);
    const updatedBook = await book.save()
    const updatedBookFinal = {
      ...updatedBook._doc
    };
    return res.status(httpStatus.OK).json(updatedBookFinal);
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
  }
}