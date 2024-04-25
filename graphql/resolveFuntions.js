module.exports = {
  truncateText(text, maxWords, maxWordLength) {
    const words = text.split(' ');
    const truncatedWords = words.slice(0, maxWords);
  
    const truncatedText = truncatedWords.map(word => {
      if (word.length > maxWordLength) {
        return word.substring(0, maxWordLength) + '...';
      }
      return word;
    });
  
    return truncatedText.join(' ');
  }
}