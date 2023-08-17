const Book = require('../models/Book');
const httpStatus = require('http-status');

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book)
  const totalRating = bookObject.ratings.reduce((accumulator, currentObject) => accumulator + currentObject.grade, 0);
  const averageRating = totalRating / bookObject.ratings.length
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    title: bookObject.title,
    author: bookObject.author,
    year: bookObject.year,
    averageRating
  });
  book.save(book)
      .then(() => res.status(httpStatus.CREATED).json({ message: 'Objet enregistré !' }))
      .catch(error => {
          res.status(httpStatus.BAD_REQUEST).json({ error });
      });
}

exports.deleteBook = (req, res, next) => {
  Book.deleteOne({ _id: req.params.id })
    .then(() => res.status(httpStatus.OK).json({ message: 'Objet supprimé !'}))
    .catch(error => res.status(httpStatus.BAD_REQUEST).json({ error }));
};

exports.modifyBook = (req, res, next) => {
   const bookObject = req.file ? {
       ...JSON.parse(req.body.book),
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
   } : { ...req.body };
   Book.findOne({_id: req.params.id})
       .then((book) => {
           if (book.userId != req.auth.userId) {
               res.status(httpStatus.UNAUTHORIZED).json({ message : 'Not authorized'});
           } else {
               Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
               .then(() => res.status(httpStatus.OK).json({message : 'Objet modifié!'}))
               .catch(error => res.status(httpStatus.UNAUTHORIZED).json({ error }));
           }
       })
       .catch((error) => {
           res.status(httpStatus.BAD_REQUEST).json({ error });
       });
};

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(httpStatus.OK).json(books))
        .catch(error => res.status(httpStatus.BAD_REQUEST).json({ error }))
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(httpStatus.OK).json(book))
    .catch(error => res.status(httpStatus.NOT_FOUND).json({ error }));
};

exports.getBestRating = (req, res, next) => {
  Book.find({})
    .sort({ averageRating: -1 }) // Trie les livres par note décroissante
    .limit(3)
    .then(book => res.status(httpStatus.OK).json(book))
    .catch(error => res.status(httpStatus.NOT_FOUND).json({ error }));
};

exports.createRating = (req, res, next) => {
  const bookId = req.params.id; // Supposons que l'identifiant du livre est passé en tant que paramètre dans l'URL
  const rating = {
    grade: req.body.rating,
    userId : req.body.userId,
  }

  Book.findOne({ _id: bookId })
    .then(async book => {
      if (!book) {
        return res.status(httpStatus.NOT_FOUND).json({ message: 'Livre non trouvé' });
      }
      book.ratings.push(rating);
      const totalRating = book.ratings.reduce((accumulator, currentObject) => accumulator + currentObject.grade, 0);
      const averageRating = totalRating / book.ratings.length
      book.averageRating = Math.floor(averageRating);
      try {
        const updatedBook = await book.save()
        return updatedBook
      } catch (error) {
        throw new Error(error)
      }
    })
    .then(updatedBook => {
      const editBook = updatedBook._doc
      const updatedBookFinal = {
        ...editBook
      };
      return res.status(httpStatus.OK).json(updatedBookFinal);
    })
    .catch(() => res.status(httpStatus.INTERNAL_SERVER_ERROR));
};
