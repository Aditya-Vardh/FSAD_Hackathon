// Removes author-identifying fields from payloads before sending them
// to reviewers (double-blind enforcement).
module.exports = (req, res, next) => {
  const payload = res.locals.payload

  const anonymisePaperObject = (paper) => {
    if (!paper || typeof paper !== 'object') return

    // Fields requested in the spec (some may not exist in your schema).
    delete paper.author_id
    delete paper.author_name
    delete paper.institution

    // Generic author container (if present).
    delete paper.author
    delete paper.authorInfo
  }

  const anonymiseItem = (item) => {
    if (!item || typeof item !== 'object') return

    if (item.paper) anonymisePaperObject(item.paper)

    // If author details are top-level, remove them too.
    delete item.author
    delete item.authorInfo
  }

  if (Array.isArray(payload)) {
    payload.forEach(anonymiseItem)
  } else if (payload && typeof payload === 'object') {
    anonymiseItem(payload)
  }

  next()
}

