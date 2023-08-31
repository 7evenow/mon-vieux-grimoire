const Book = require('../models/Book');
const httpStatus = require('http-status');
const fs = require('fs');
const fsPromise = require('fs/promises')

exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    
    const totalRating = bookObject.ratings.reduce((accumulator, currentObject) => accumulator + currentObject.grade, 0);
    const averageRating = totalRating / bookObject.ratings.length;
    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path}`;
    const book = new Book({
      userId: req.auth.userId,
      title: bookObject.title,
      author: bookObject.author,
      imageUrl,
      year:bookObject.year,
      genre:bookObject.genre,
      ratings: [{
        userId: req.auth.userId ,
        grade:bookObject.ratings[0].grade,
      }],
      averageRating
    });

    await book.save();

    return res.status(httpStatus.CREATED).json({ message: 'Objet enregistré !' });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

exports.modifyBook = async (req, res, next) => {
  try {
    const bookFromDB = await Book.findOne({ _id: req.params.id });

    if (!bookFromDB) {
      fs.unlinkSync(req.file.path)
      return res.status(httpStatus.NOT_FOUND).json({ message: 'non trouvé' });
    }
    if (bookFromDB.userId !== req.auth.userId) {
      fs.unlinkSync(req.file.path)
      return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Not authorized' });
    }

    const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/${req.file.path}`
    } : { ...req.body };
    delete bookObject.userId;
    delete bookObject._id;

    await Book.updateOne({ _id: req.params.id }, { ...bookObject });

    if (req.file) {
      // Suppression l'ancienne image
      const oldFilename = bookFromDB.imageUrl.split("/images/")[1];
      fs.unlinkSync(`images/${oldFilename}`); 
    }

    return res.status(httpStatus.OK).json({ message: "mise à jour!" });

  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    return res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id})
    if (book.userId !== req.auth.userId){
      return res.status(httpStatus.NOT_FOUND).json({ message: "Livre non trouvé ou non autorisé" });
    } 
    
    const filename = book.imageUrl.split('/images/')[1];
    try {
        await fsPromise.unlink(`images/${filename}`);
        await Book.deleteOne({ _id: req.params.id });
        return res.status(httpStatus.OK).json({ message: 'Objet supprimé !' });
      } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
      }
  }
  catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: error.message })
  }
}

exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find()
    return res.status(httpStatus.OK).json(books)
  }
  catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
}

exports.getOneBook = async (req, res, next) => {
  try {
    const oneBook = await Book.findOne({ _id: req.params.id })
    return res.status(httpStatus.OK).json(oneBook)
  } catch (error) {
    res.status(httpStatus.NOT_FOUND).json({ error: error.message });
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