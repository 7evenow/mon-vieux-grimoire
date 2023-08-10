const Book = require('../models/Book');
const httpStatus = require('http-status');

exports.createBook = (req, res, next) => {
  console.log(req.body)
  const bookObject = JSON.parse(req.body.book)
  delete bookObject._id
  delete bookObject._userId
  const totalRating = bookObject.ratings.reduce((accumulator, currentObject) => accumulator + currentObject.grade, 0);
  const averageRating = totalRating / bookObject.ratings.length
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    title: bookObject.title,
    author: bookObject.author,
    year: bookObject.year,
    averageRating: averageRating
      
  });
  book.save(book)
      .then(() => res.status(201).json({ mesagge: 'Objet enregistré !' }))
      .catch(error => {
          res.status(400).json({ error });
      });
}

exports.deleteBook = (req, res, next) => {
  Book.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.modifyBook = (req, res, next) => {
   const bookObject = req.file ? {
       ...JSON.parse(req.body.book),
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
   } : { ...req.body };
 
   delete bookObject._userId;
   Book.findOne({_id: req.params.id})
       .then((book) => {
           if (book.userId != req.auth.userId) {
               res.status(401).json({ message : 'Not authorized'});
           } else {
               Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
               .then(() => res.status(200).json({message : 'Objet modifié!'}))
               .catch(error => res.status(401).json({ error }));
           }
       })
       .catch((error) => {
           res.status(400).json({ error });
       });
};

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }))
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

exports.getBestRating = (req, res, next) => {
  Book.find({})
    .sort({ averageRating: -1 }) // Trie les livres par note décroissante
    .limit(3)
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

exports.createRating = (req, res, next) => {
  const bookId = req.params.id; // Supposons que l'identifiant du livre est passé en tant que paramètre dans l'URL
  const rating = {
    grade: req.body.rating,
    userId : req.body.userId,
  }
  Book.findOne({ _id: bookId })
    .then(book => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }
      book.ratings.push(rating);
      const totalRating = book.ratings.reduce((accumulator, currentObject) => accumulator + currentObject.grade, 0);
      const averageRating = totalRating / book.ratings.length
      book.averageRating = Floor(averageRating);
      return book.save();
    })
    .then(updatedBook => {
      const updatedBookFinal = {
        ...book,
        id: bookId,
      };
      console.log(updatedBookFinal);
      res
        .status(200)
        .json({ message: "Note ajoutée avec succès", book: updatedBookFinal });
      console.log(bookId);
    })
    .catch(() => res.status(httpStatus.INTERNAL_SERVER_ERROR));
};
